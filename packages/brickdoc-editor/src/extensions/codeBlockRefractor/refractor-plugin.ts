import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'
import { Node as ProsemirrorNode } from 'prosemirror-model'
import { findChildren } from '@tiptap/core'
import type { Refractor } from 'refractor/lib/core'

function parseNodes(nodes: any[], className: string[] = []): Array<{ text: string; classes: string[] }> {
  return nodes
    .map(node => {
      const classes = [...className, ...(node.properties ? node.properties.className : [])]

      if (node.children) {
        return parseNodes(node.children, classes)
      }

      return {
        text: node.value,
        classes
      }
    })
    .flat()
}

function getHighlightNodes(result: any) {
  return result.children || []
}

function getDecorations({
  doc,
  name,
  refractor,
  defaultLanguage
}: {
  doc: ProsemirrorNode
  name: string
  refractor: Refractor
  defaultLanguage: string
}) {
  const decorations: Decoration[] = []

  findChildren(doc, node => node.type.name === name).forEach(block => {
    let from = block.pos + 1
    const language = block.node.attrs.language || defaultLanguage
    const languages = refractor.listLanguages()

    const nodes =
      language && languages.includes(language)
        ? getHighlightNodes(refractor.highlight(block.node.textContent, language))
        : // refractor doesn't support `hightlightAuto` api, use defaultLanguage as fallback
          getHighlightNodes(refractor.highlight(block.node.textContent, defaultLanguage))

    parseNodes(nodes).forEach(node => {
      const to = from + node.text.length

      if (node.classes.length) {
        const decoration = Decoration.inline(from, to, {
          class: node.classes.join(' ')
        })

        decorations.push(decoration)
      }

      from = to
    })
  })

  return DecorationSet.create(doc, decorations)
}

export function RefractorPlugin({
  name,
  refractor,
  defaultLanguage
}: {
  name: string
  refractor: Refractor
  defaultLanguage: string
}) {
  return new Plugin({
    key: new PluginKey('refractor'),

    state: {
      init: (_, { doc }) =>
        getDecorations({
          doc,
          name,
          refractor,
          defaultLanguage
        }),
      apply: (transaction, decorationSet, oldState, newState) => {
        const oldNodeName = oldState.selection.$head.parent.type.name
        const newNodeName = newState.selection.$head.parent.type.name
        const oldNodes = findChildren(oldState.doc, node => node.type.name === name)
        const newNodes = findChildren(newState.doc, node => node.type.name === name)

        if (
          transaction.docChanged &&
          // Apply decorations if:
          // selection includes named node,
          ([oldNodeName, newNodeName].includes(name) ||
            // OR transaction adds/removes named node,
            newNodes.length !== oldNodes.length ||
            // OR transaction has changes that completely encapsulte a node
            // (for example, a transaction that affects the entire document).
            // Such transactions can happen during collab syncing via y-prosemirror, for example.
            transaction.steps.some((step: any) => {
              return (
                step.from !== undefined &&
                step.to !== undefined &&
                oldNodes.some(node => {
                  return node.pos >= step.from && node.pos + node.node.nodeSize <= step.to
                })
              )
            }))
        ) {
          return getDecorations({
            doc: transaction.doc,
            name,
            refractor,
            defaultLanguage
          })
        }

        return decorationSet.map(transaction.mapping, transaction.doc)
      }
    },

    props: {
      decorations(state) {
        return this.getState(state)
      }
    }
  })
}
