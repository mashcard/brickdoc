import { useNewPatchSubscription, PatchBaseObject, Patchtype, Patchstate, Block } from '@/BrickdocGraphQL'
import { Fragment } from 'prosemirror-model'
import { Editor, ChainedCommands } from '@tiptap/core'
import { EditorContentProps } from '@brickdoc/editor'
import { blockToNode } from '../../common/blocks'

export function useDocumentSubscription({
  docid,
  editor,
  setDocumentEditable,
  refetchDocument,
  updateCachedDocBlock
}: {
  docid: string
  editor: EditorContentProps['editor'] | null
  setDocumentEditable: (editable: boolean) => void
  refetchDocument: () => void
  updateCachedDocBlock: (block: Block, toDelete: boolean) => void
}): void {
  const applyPatch = (editor: Editor, chainedCommands: ChainedCommands, patch: PatchBaseObject) => {
    const block = patch.payload as Block
    const newNode = block && blockToNode(block)

    chainedCommands.command(({ tr }) => {
      let targetNode = tr.doc
      if (patch.path[0] !== targetNode.attrs.uuid) {
        console.warn("Root node uuid doesn't match patch.path", tr.doc.attrs?.uuid, patch.path[0])
        return false
      }
      let startPos = -1
      if (patch.path.length > 1) {
        patch.path.slice(1).forEach(path => {
          for (let i = 0; i < targetNode.childCount; i += 1) {
            const child = targetNode.child(i)
            if (child.attrs.uuid === path) {
              startPos += 1
              targetNode = child
              return true
            }
            startPos += child.nodeSize
          }
          console.warn('Patch path not found', patch.path, tr.doc)
        })
      }

      const endPos = startPos + targetNode.nodeSize

      switch (patch.patchType) {
        case Patchtype.Add:
          tr.insert(endPos - 1, editor.schema.nodeFromJSON(newNode))
          break
        case Patchtype.Update:
          {
            let newContent: Fragment | undefined = targetNode.content
            if (newNode.content === null) {
              // Clear content
              // FIXME: the server doesn't give clear differences between `clear` content and `don't change` content
              newContent = undefined
            } else if (newNode.content) {
              // Update content
              newContent = Fragment.fromArray(newNode.content.map(editor.schema.nodeFromJSON))
            }

            const updatedNode = targetNode.copy(newContent)
            const oldSort = targetNode.attrs?.sort
            if (newNode.text) updatedNode.text = newNode.text
            Object.assign(updatedNode.attrs, newNode.attrs)

            if (patch.path.length <= 1) {
              // For root node
              tr.replaceWith(startPos + 1, endPos - 1, updatedNode)
              chainedCommands.setDocAttrs(newNode.attrs ?? {})
            } else {
              // For normal node
              tr.replaceWith(startPos, endPos, updatedNode)

              // Move the node to the correct position if its `sort` changed
              if (newNode.attrs?.sort !== undefined && newNode.attrs.sort !== oldSort) {
                let resolvedPos = tr.doc.resolve(startPos)
                tr.delete(startPos, startPos + updatedNode.nodeSize)

                resolvedPos = tr.doc.resolve(startPos)
                let insertPos = resolvedPos.start()
                for (let i = 0; i < resolvedPos.parent.childCount; i += 1) {
                  const child = resolvedPos.parent.child(i)
                  if (newNode.attrs.sort <= child.attrs.sort) {
                    break
                  }
                  insertPos += child.nodeSize
                }
                tr.insert(insertPos, updatedNode)
              }
            }
          }
          break
        case Patchtype.Delete:
          if (patch.path.length < 1) {
            console.warn('Root node cannot be deleted')
          } else {
            tr.delete(startPos, endPos)
          }
      }
      return true
    })

    updateCachedDocBlock(block, patch.patchType === Patchtype.Delete)
  }
  useNewPatchSubscription({
    onSubscriptionData: ({ subscriptionData: { data } }) => {
      if (!data?.newPatch?.patches?.length) return
      if (!editor) {
        console.warn('New patch arrived but the editor has not been initialized')
        return
      }

      const { newPatch } = data

      if (newPatch.state === Patchstate.Deleted) {
        console.log('Delete page ...')
        return
      }

      const patches = newPatch.patches.filter(p => p.operatorId !== globalThis.brickdocContext.uuid)

      if (patches.length === 0) return

      setDocumentEditable(false)
      try {
        const chainedCommands = editor.chain().setMeta('preventUpdate', true)
        patches.forEach(patch => applyPatch(editor, chainedCommands, patch))
        chainedCommands.setDocAttrs({ ...editor.state.doc.attrs, seq: newPatch.seq }).run()
        console.log('Patch applied', { uuid: globalThis.brickdocContext.uuid, patches, newPatch })
      } catch (e) {
        console.error(e)
        setDocumentEditable(false)
        refetchDocument()
        setDocumentEditable(true)
      }
      setDocumentEditable(true)
    },
    variables: { docId: docid }
  })
}
