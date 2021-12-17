import React from 'react'
import { NodeViewProps } from '@tiptap/react'
import WebViewer, { WebViewerInstance } from '@pdftron/webviewer'
import { TEST_ID_ENUM } from '@brickdoc/test-helper'
import { FileIcon } from '../FileIcon/FileIcon'
import { FileType } from '../../../../helpers/file'
import { useActionOptions } from '../useActionOptions'
import { useAttachmentMethods, UseAttachmentMethodsProps } from '../useAttachmentMethods'
import './PreviewMode.less'
import { BlockContainer } from '../../../../components'

export interface PreviewModeProps extends Omit<UseAttachmentMethodsProps, 'webViewer'> {
  editor: NodeViewProps['editor']
  fileName: string
  fileType: FileType
}

export const PreviewMode: React.FC<PreviewModeProps> = ({ editor, fileName, fileType, ...attachmentMethodsProps }) => {
  const viewer = React.useRef<HTMLDivElement>(null)
  const [viewerInstance, setViewerInstance] = React.useState<WebViewerInstance>()
  React.useEffect(() => {
    void WebViewer(
      {
        path: '/pdftron',
        css: '/pdftron.css',
        disabledElements: ['toolsHeader', 'header', 'textPopup', 'contextMenuPopup'],
        initialDoc: attachmentMethodsProps.fileUrl
      },
      viewer.current as HTMLDivElement
    ).then(instance => {
      setViewerInstance(instance)
      instance.UI.setFitMode(instance.UI.FitMode.FitWidth)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [{ onCopy, onDelete, onDownload, onToLinkMode, onFullScreen, onToPreviewMode }] = useAttachmentMethods({
    webViewer: viewerInstance,
    ...attachmentMethodsProps
  })

  const [actionOptions] = useActionOptions({
    mode: 'preview',
    onCopy,
    onDelete,
    onDownload,
    onToLinkMode,
    onToPreviewMode,
    onFullScreen
  })

  return (
    <BlockContainer editor={editor} options={actionOptions}>
      <div data-testid={TEST_ID_ENUM.editor.linkBlock.pdftron.id} className="brickdoc-pdftron-block">
        <div ref={viewer} className="brickdoc-pdftron-container" />
        <div className="brickdoc-pdftron-info">
          <FileIcon className="brickdoc-pdftron-info-icon" fileType={fileType} />
          {fileName}
        </div>
      </div>
    </BlockContainer>
  )
}
