import {
  Editor,
  NodeView,
  NodeViewProps,
  NodeViewRenderer,
  NodeViewRendererOptions,
  NodeViewRendererProps
} from '@tiptap/core'
import { Editor as ExtendedEditor } from './Editor'
import { Node as ProseMirrorNode } from 'prosemirror-model'
import { Decoration, NodeView as ProseMirrorNodeView } from 'prosemirror-view'
import { FunctionComponent } from 'react'

import { ReactRenderer } from './ReactRenderer'
import { ReactNodeViewContext, ReactNodeViewContextProps } from './useReactNodeView'
import { flushSync } from 'react-dom'

export interface ReactNodeViewRendererOptions extends NodeViewRendererOptions {
  update:
    | ((props: {
        oldNode: ProseMirrorNode
        oldDecorations: Decoration[]
        newNode: ProseMirrorNode
        newDecorations: Decoration[]
        updateProps: () => void
      }) => boolean)
    | null
  as?: string
  className?: string
}

class ReactNodeView extends NodeView<FunctionComponent, Editor, ReactNodeViewRendererOptions> {
  // property declaration will cause property be override by undefined
  // because property assignment is inside mount() but not constructor
  // contentDOMElement!: HTMLElement | null
  // renderer!: ReactRenderer

  override mount(): void {
    const props: NodeViewProps = {
      editor: this.editor,
      node: this.node,
      decorations: this.decorations,
      selected: false,
      extension: this.extension,
      getPos: () => this.getPos(),
      updateAttributes: (attributes = {}) => this.updateAttributes(attributes),
      deleteNode: () => this.deleteNode()
    }

    if (!(this.component as any).displayName) {
      const capitalizeFirstChar = (string: string): string => {
        return string.charAt(0).toUpperCase() + string.substring(1)
      }

      this.component.displayName = capitalizeFirstChar(this.extension.name)
    }

    const ReactNodeViewProvider: FunctionComponent = componentProps => {
      const Component = this.component
      const onDragStart = this.onDragStart.bind(this)
      const nodeViewContentRef: ReactNodeViewContextProps['nodeViewContentRef'] = element => {
        // @ts-expect-error
        if (element && this.contentDOMElement && element.firstChild !== this.contentDOMElement) {
          // @ts-expect-error
          element.appendChild(this.contentDOMElement)
        }
      }

      return (
        // eslint-disable-next-line react/jsx-no-constructed-context-values
        <ReactNodeViewContext.Provider value={{ onDragStart, nodeViewContentRef }}>
          <Component {...componentProps} />
        </ReactNodeViewContext.Provider>
      )
    }

    ReactNodeViewProvider.displayName = 'ReactNodeView'

    // @ts-expect-error
    this.contentDOMElement = this.node.isLeaf ? null : document.createElement(this.node.isInline ? 'span' : 'div')

    // @ts-expect-error
    if (this.contentDOMElement) {
      // For some reason the whiteSpace prop is not inherited properly in Chrome and Safari
      // With this fix it seems to work fine
      // See: https://github.com/ueberdosis/tiptap/issues/1197
      // @ts-expect-error
      this.contentDOMElement.style.whiteSpace = 'inherit'
    }

    let as = this.node.isInline ? 'span' : 'div'

    if (this.options.as) {
      as = this.options.as
    }

    const { className = '' } = this.options

    flushSync(() => {
      // @ts-expect-error
      this.reactRenderer = new ReactRenderer(ReactNodeViewProvider, {
        editor: this.editor,
        props,
        as,
        className: `node-${this.node.type.name} ${className}`.trim()
      })
    })
  }

  override get dom(): HTMLElement {
    if (
      // @ts-expect-error
      this.reactRenderer.element.firstElementChild &&
      // @ts-expect-error
      !this.reactRenderer.element.firstElementChild?.hasAttribute('data-node-view-wrapper')
    ) {
      throw Error('Please use the NodeViewWrapper component for your node view.')
    }

    // @ts-expect-error
    return this.reactRenderer.element as HTMLElement
  }

  override get contentDOM(): HTMLElement | null {
    if (this.node.isLeaf) {
      return null
    }

    // @ts-expect-error
    return this.contentDOMElement
  }

  update(node: ProseMirrorNode, decorations: Decoration[]): boolean {
    const updateProps = (props?: Record<string, any>): void => {
      // @ts-expect-error
      this.reactRenderer.updateProps(props)
    }

    if (node.type !== this.node.type) {
      return false
    }

    if (typeof this.options.update === 'function') {
      const oldNode = this.node
      const oldDecorations = this.decorations

      this.node = node
      this.decorations = decorations

      return this.options.update({
        oldNode,
        oldDecorations,
        newNode: node,
        newDecorations: decorations,
        updateProps: () => updateProps({ node, decorations })
      })
    }

    if (node === this.node && this.decorations === decorations) {
      return true
    }

    this.node = node
    this.decorations = decorations

    updateProps({ node, decorations })

    return true
  }

  selectNode(): void {
    // @ts-expect-error
    this.reactRenderer.updateProps({
      selected: true
    })
  }

  deselectNode(): void {
    // @ts-expect-error
    this.reactRenderer.updateProps({
      selected: false
    })
  }

  destroy(): void {
    // @ts-expect-error
    this.reactRenderer.destroy()
    // @ts-expect-error
    this.contentDOMElement = null
  }
}

export function ReactNodeViewRenderer(
  component: any,
  options?: Partial<ReactNodeViewRendererOptions>
): NodeViewRenderer {
  return (props: NodeViewRendererProps) => {
    // try to get the parent component
    // this is important for vue devtools to show the component hierarchy correctly
    // maybe it’s `undefined` because <editor-content> isn’t rendered yet
    if (!(props.editor as ExtendedEditor).updatePortal) {
      return {}
    }

    return new ReactNodeView(component, props, options) as unknown as ProseMirrorNodeView
  }
}
