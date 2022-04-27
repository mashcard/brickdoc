import { useCallback } from 'react'
import { WebViewerInstance } from '@pdftron/webviewer'
import { EmbedBlockType, UpdateEmbedBlockAttributes } from '../EmbedView'

export interface UseAttachmentMethodsProps {
  fileUrl: string
  webViewer?: WebViewerInstance
  blockType: EmbedBlockType
  updateEmbedBlockAttributes: UpdateEmbedBlockAttributes
}

export interface AttachmentMethods {
  onFullScreen: () => void
  onDownload: () => void
}

export function useAttachmentMethods({ webViewer, fileUrl }: UseAttachmentMethodsProps): [AttachmentMethods] {
  const handleDownload = useCallback((): void => {
    const link = document.createElement('a')
    link.download = 'true'
    link.href = fileUrl
    link.click()
  }, [fileUrl])

  const handleFullscreen = useCallback(() => {
    webViewer?.UI.toggleFullScreen()
  }, [webViewer?.UI])

  return [
    {
      onDownload: handleDownload,
      onFullScreen: handleFullscreen
    }
  ]
}
