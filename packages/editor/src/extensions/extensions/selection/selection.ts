import { Editor, SingleCommands } from '@tiptap/core'
import { Plugin, PluginKey, EditorState, TextSelection } from 'prosemirror-state'
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view'
import { findNodesInSelection } from '../../../helpers'
import { createExtension } from '../../common'
import { meta, SelectAttributes, SelectionOptions } from './meta'
import { meta as paragraphMeta } from '../../blocks/paragraph/meta'
import { meta as headingMeta } from '../../blocks/heading/meta'
import { meta as listItemMeta } from '../../blocks/listItem/meta'
import { meta as orderedListMeta } from '../../blocks/orderedList/meta'
import { meta as bulletListMeta } from '../../blocks/bulletList/meta'
import { meta as taskItemMeta } from '../../blocks/taskItem/meta'
import { meta as taskListMeta } from '../../blocks/taskList/meta'
import { meta as calloutMeta } from '../../blocks/callout/meta'
import { meta as blockquoteMeta } from '../../blocks/blockquote/meta'
import { MultipleNodeSelection } from './MultipleNodeSelection'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    multipleNodeSelection: {
      /**
       * Set a multiple node selection
       */
      setMultipleNodeSelection: (anchor: number, head: number) => ReturnType
      /**
       * start select nodes
       */
      startMultipleNodeSelection: (event: MouseEvent) => ReturnType
    }
  }
}

const allowedNodeTypes = [
  paragraphMeta.name,
  headingMeta.name,
  listItemMeta.name,
  orderedListMeta.name,
  bulletListMeta.name,
  taskItemMeta.name,
  taskListMeta.name,
  calloutMeta.name,
  blockquoteMeta.name
]

export const isTextContentSelected = ({ editor, from, to }: { editor: Editor; from: number; to: number }): boolean => {
  if (!editor.isEditable || editor.isDestroyed) return false
  if (from === to) return false

  const isEmpty = editor.state.doc.textBetween(from, to).length === 0

  if (isEmpty) return false

  let show = false

  const nodes = findNodesInSelection(editor, from, to)

  for (const { node } of nodes) {
    if (node) {
      // Text node
      if (node.type.name === 'text') {
        show = true
      } else if (allowedNodeTypes.includes(node.type.name)) {
        show = true
      } else {
        return false
      }
    }
  }

  return show
}

const DEFAULT_TEXT_SELECTION_CLASS = 'text-selection-highlight'
const DEFAULT_NODE_SELECTION_CLASS = 'node-selection-highlight'

function resolveCoordinates(
  anchor: { x: number; y: number },
  head: {
    x: number
    y: number
  },
  docRect: {
    top: number
    left: number
    bottom: number
    right: number
  }
): null | {
  anchor: {
    x: number
    y: number
  }
  head: {
    x: number
    y: number
  }
} {
  if (anchor.y < docRect.top && head.y < docRect.top) return null
  if (anchor.y > docRect.bottom && head.y > docRect.bottom) return null
  if (anchor.x < docRect.left && head.x < docRect.left) return null
  if (anchor.x > docRect.right && head.x > docRect.right) return null

  // because of the behavior of `view.posAtCoords`
  // we have to lock the anchor as left top of the selecting area and
  // the head as right bottom of the selecting area
  const y1 = Math.max(Math.min(docRect.bottom, anchor.y), docRect.top)
  const y2 = Math.max(Math.min(docRect.bottom, head.y), docRect.top)

  return {
    anchor: {
      x: docRect.left,
      y: Math.min(y1, y2)
    },
    head: {
      x: docRect.right,
      y: Math.max(y1, y2)
    }
  }
}

function startSelection(view: EditorView, event: MouseEvent, commands: SingleCommands): void {
  const result = view.posAtCoords({ left: event.pageX, top: event.pageY })

  // if click happens outside the doc nodes, assume a Multiple Node Selection will happen.
  // so call blur to avoid Text Selection happen.
  // case: result = null
  // click outside the document
  // case: result.inside === -1
  // click on the doc node
  if (!result || result.inside === -1) {
    view.dispatch(
      view.state.tr.setMeta('multipleNodeSelectingStart', {
        x: event.pageX,
        y: event.pageY
      })
    )
    commands.blur()
  }
}

function cleanupSelection(editor: Editor, view: EditorView, x: number, y: number): void {
  const anchor = view.posAtCoords({ left: x, top: y })
  editor.commands.setTextSelection(anchor?.pos ?? 0)
}

function resolveSelection(editor: Editor, view: EditorView, pluginState: SelectionState, event: MouseEvent): void {
  if (!pluginState.multiNodeSelecting) return

  const { x, y } = pluginState.multiNodeSelecting
  const rect = view.dom.getBoundingClientRect()

  const coordinates = resolveCoordinates({ x, y }, { x: event.pageX, y: event.pageY }, rect)

  if (!coordinates) {
    cleanupSelection(editor, view, x, y)
    return
  }

  const anchor = view.posAtCoords({ left: coordinates.anchor.x, top: coordinates.anchor.y })
  const head = view.posAtCoords({ left: coordinates.head.x, top: coordinates.head.y })

  if (!anchor || !head) {
    cleanupSelection(editor, view, x, y)
    return
  }

  editor.commands.setMultipleNodeSelection(anchor.pos, head.pos)
}

interface SelectionState {
  multiNodeSelecting:
    | false
    | {
        selecting: boolean
        x: number
        y: number
      }
}

export const SelectionPluginKey = new PluginKey<SelectionState>(meta.name)

class SelectionView {
  view: EditorView
  editor: Editor
  options: SelectionOptions

  constructor(editor: Editor, view: EditorView, options: SelectionOptions) {
    this.editor = editor
    this.view = view
    this.options = options

    window.addEventListener('mouseup', this.mouseup)
    window.addEventListener('mousemove', this.mousemove)
  }

  drawMouseArea = (anchor: { x: number; y: number }, head: { x: number; y: number }) => {
    let area = document.getElementById('selection-mouse-area')

    if (!area) {
      area = document.createElement('div')
      area.id = 'selection-mouse-area'
      document.body.append(area)
    }

    area.classList.add(this.options.nodeSelection.mouseArea?.className ?? '')
    area.style.position = 'absolute'
    area.style.left = `${Math.min(anchor.x, head.x)}px`
    area.style.width = `${Math.abs(anchor.x - head.x)}px`
    area.style.top = `${Math.min(anchor.y, head.y)}px`
    area.style.height = `${Math.abs(anchor.y - head.y)}px`
  }

  clearMouseArea = () => {
    const area = document.getElementById('selection-mouse-area')
    if (area) document.body.removeChild(area)
  }

  mousemove = (event: MouseEvent) => {
    const pluginState = SelectionPluginKey.getState(this.view.state)
    if (pluginState?.multiNodeSelecting) {
      if (!pluginState.multiNodeSelecting.selecting) {
        this.view.dispatch(this.view.state.tr.setMeta('multipleNodeSelecting', true))
      }
      this.drawMouseArea(pluginState.multiNodeSelecting, event)
      resolveSelection(this.editor, this.view, pluginState, event)
    }
  }

  mouseup = (event: MouseEvent) => {
    this.clearMouseArea()
    const pluginState = SelectionPluginKey.getState(this.view.state)
    if (pluginState?.multiNodeSelecting) {
      this.view.dispatch(this.view.state.tr.setMeta('multipleNodeSelectingEnd', true))
      if (!pluginState.multiNodeSelecting.selecting) {
        const { x, y } = pluginState.multiNodeSelecting
        cleanupSelection(this.editor, this.view, x, y)
      }

      if (this.editor.state.selection instanceof MultipleNodeSelection) {
        this.editor.commands.focus()
      }
    }
  }

  destroy(): void {
    window.removeEventListener('mouseup', this.mouseup)
    window.removeEventListener('mousemove', this.mousemove)
  }
}

export const Selection = createExtension<SelectionOptions, SelectAttributes>({
  name: meta.name,

  addCommands() {
    return {
      setMultipleNodeSelection:
        (anchor, head) =>
        ({ dispatch, tr }) => {
          if (dispatch) {
            const { doc } = tr
            const minPos = 0
            const maxPos = MultipleNodeSelection.atEnd(doc).to

            const resolvedAnchor = Math.max(Math.min(anchor, maxPos), minPos)
            const resolvedHead = Math.max(Math.min(head, maxPos), minPos)
            const selection = MultipleNodeSelection.create(doc, resolvedAnchor, resolvedHead)

            tr.setSelection(selection)
          }

          return true
        },
      startMultipleNodeSelection:
        event =>
        ({ view, commands }) => {
          startSelection(view, event, commands)
          return true
        }
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin<SelectionState>({
        key: SelectionPluginKey,
        state: {
          init() {
            return {
              multiNodeSelecting: false
            }
          },
          apply(tr, value, oldState, newState) {
            const coordinates = tr.getMeta('multipleNodeSelectingStart')
            if (coordinates) {
              return { ...value, multiNodeSelecting: coordinates }
            }

            if (tr.getMeta('multipleNodeSelecting')) {
              return { ...value, multiNodeSelecting: { ...value.multiNodeSelecting, selecting: true } }
            }

            if (tr.getMeta('multipleNodeSelectingEnd')) {
              return { ...value, multiNodeSelecting: false }
            }

            return { ...value }
          }
        },
        view: view => new SelectionView(this.editor, view, this.options),
        props: {
          handleDOMEvents: {
            mousedown: (view, event) => {
              startSelection(view, event, this.editor.commands)
              return false
            }
          },
          decorations: (state: EditorState) => {
            const { from, to } = state.selection
            const decorations: Decoration[] = []

            if (!this.editor.isEditable) return
            if (state.selection instanceof TextSelection && from === to) return

            if (state.selection instanceof TextSelection) {
              const inlineDecoration = Decoration.inline(from, to, {
                class: this.options.textSelection?.className ?? DEFAULT_TEXT_SELECTION_CLASS,
                style: this.options.textSelection?.style
              })
              decorations.push(inlineDecoration)

              return DecorationSet.create(this.editor.state.doc, decorations)
            }

            if (state.selection instanceof MultipleNodeSelection) {
              state.selection.ranges.forEach(range => {
                const nodeDecoration = Decoration.node(range.$from.pos, range.$to.pos, {
                  class: this.options.nodeSelection?.className ?? DEFAULT_NODE_SELECTION_CLASS,
                  style: this.options.nodeSelection?.style
                })
                decorations.push(nodeDecoration)
              })

              return DecorationSet.create(this.editor.state.doc, decorations)
            }
          },
          createSelectionBetween: (view, $anchor, $head) => {
            if (!this.editor.isEditable) return
            if ($anchor.pos === $head.pos) return
            if (!(this.editor.state.selection instanceof TextSelection)) return

            // remove non-text node and empty text node selection by check: to - from > 1
            // because we don't want non-text nodes at the end of Text Selection
            // due to window.getSelection() will automatically select the nearest text if end of the selection is not a text node
            const nodeRanges = findNodesInSelection(this.editor, $anchor.pos, $head.pos).filter(
              range => range.to - range.from > 1
            )

            if (nodeRanges.length > 0) {
              const to = nodeRanges[nodeRanges.length - 1].to
              return TextSelection.create(this.editor.state.doc, $anchor.pos, to)
            }
          }
        }
      })
    ]
  }
})
