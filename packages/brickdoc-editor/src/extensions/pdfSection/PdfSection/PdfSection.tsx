/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import * as React from 'react'
import { Resizable } from 're-resizable'
import { NodeViewProps } from '@tiptap/react'
import { Button, Popover, Icon, DeprecatedMenu as Menu, message, Modal } from '@brickdoc/design-system'
import { Dashboard, UploadResultData, ImportSourceOption, UploadProgress } from '@brickdoc/uploader'
import { PdfDocument } from './PdfDocument'
import { linkStorage, sizeFormat } from '../../../helpers/file'
import { ActionOptionGroup, BlockContainer } from '../../../components'
import { useEditorI18n } from '../../../hooks'
import './styles.less'
import { getBlobUrl } from '../../../helpers/getBlobUrl'
import { EditorDataSourceContext } from '../../../dataSource/DataSource'

const MAX_WIDTH = 700

export interface PdfSectionAttributes {
  width?: number
  height?: number
  key: string
  source: string
  type: string
}

// TODO: handle pdf load on error
export const PdfSection: React.FC<NodeViewProps> = ({ editor, node, deleteNode, getPos, updateAttributes }) => {
  const editorDataSource = React.useContext(EditorDataSourceContext)
  const { t } = useEditorI18n()
  const latestPdfAttributes = React.useRef<Partial<PdfSectionAttributes>>({})
  const updatePdfAttributes = (newAttributes: Partial<PdfSectionAttributes>): void => {
    latestPdfAttributes.current = {
      ...latestPdfAttributes.current,
      ...newAttributes
    }

    if (!node.attrs.attachment?.source && !latestPdfAttributes.current.source) {
      return
    }

    updateAttributes({
      attachment: {
        ...node.attrs.attachment,
        ...latestPdfAttributes.current
      }
    })
  }

  const [progress, setProgress] = React.useState<UploadProgress>()
  const onProgress = (progress: UploadProgress): void => setProgress(progress)

  const onUploaded = (data: UploadResultData): void => {
    linkStorage.set(node.attrs.uuid, data.viewUrl!)
    updatePdfAttributes({ key: data.url, source: data.meta?.source.toUpperCase() })
  }

  const handleDelete = (): void => {
    Modal.confirm({
      title: t('pdf_section.deletion_confirm.title'),
      okText: t('pdf_section.deletion_confirm.ok'),
      okButtonProps: {
        danger: true
      },
      cancelText: t('pdf_section.deletion_confirm.cancel'),
      icon: null,
      onOk: () => deleteNode()
    })
  }

  const url =
    getBlobUrl(node.attrs?.uuid, node.attrs?.attachment ?? {}, editorDataSource.blobs) ??
    linkStorage.get(node.attrs.uuid)
  if (url) {
    const handleCopy = async (): Promise<void> => {
      await navigator.clipboard.writeText(url)
      void message.success(t('pdf_section.copy_hint'))
    }

    const actionOptions: ActionOptionGroup = [
      [
        {
          type: 'button',
          Icon: <Icon.Link />,
          onClick: handleCopy
        }
      ],
      {
        type: 'button',
        Icon: <Icon.Delete />,
        onClick: handleDelete
      }
    ]

    return (
      <BlockContainer editor={editor} actionOptions={actionOptions}>
        <div role="dialog" className="brickdoc-block-pdf-section-container">
          <Resizable
            className="pdf-section-control-panel"
            maxWidth="100%"
            minWidth={40}
            handleClasses={{
              left: 'pdf-section-control-left-drag',
              right: 'pdf-section-control-right-drag',
              bottom: 'pdf-section-control-bottom-drag',
              bottomLeft: 'pdf-section-control-bottom-left-drag',
              bottomRight: 'pdf-section-control-bottom-right-drag'
            }}
            handleStyles={{
              left: {
                left: '8px',
                width: '6px',
                height: '40px',
                top: '50%'
              },
              right: {
                right: '8px',
                width: '6px',
                height: '40px',
                top: '50%'
              },
              bottom: {
                width: '40px',
                height: '6px',
                bottom: '8px',
                left: '50%'
              },
              bottomLeft: {
                left: '8px',
                width: '24px',
                height: '24px',
                bottom: '8px',
                cursor: 'nesw-resize'
              },
              bottomRight: {
                right: '8px',
                width: '24px',
                height: '24px',
                bottom: '8px',
                cursor: 'nwse-resize'
              }
            }}
            enable={{
              top: false,
              topLeft: false,
              topRight: false,
              bottom: true,
              bottomLeft: true,
              bottomRight: true,
              left: true,
              right: true
            }}
            size={{
              width: node.attrs.attachment.width,
              height: node.attrs.attachment.height
            }}
            onResizeStop={(e, direction, ref, d) => {
              updatePdfAttributes({
                width: Math.min(Number(node.attrs.attachment.width) + d.width, MAX_WIDTH),
                height: Number(node.attrs.attachment.height) + d.height
              })
            }}
          >
            <Popover
              trigger="click"
              placement="bottom"
              overlayClassName="pdf-section-menu-popover"
              content={
                <Menu className="pdf-section-menu">
                  <Menu.Item onClick={handleCopy}>
                    <Icon.Copy />
                    {t('pdf_section.menu.copy')}
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item onClick={handleDelete}>
                    <Icon.Delete />
                    {t('pdf_section.menu.delete')}
                  </Menu.Item>
                </Menu>
              }
            >
              <div className="pdf-section-menu-button">
                <Icon.More className="pdf-section-menu-icon" />
              </div>
            </Popover>
            <PdfDocument file={url} scale={Number(node.attrs.attachment.width) / MAX_WIDTH} />
          </Resizable>
        </div>
      </BlockContainer>
    )
  }

  const importSources: ImportSourceOption[] = [
    {
      type: 'upload',
      buttonText: t('pdf_section.import_sources.upload.button_text'),
      acceptType: 'application/pdf'
    },
    {
      type: 'link',
      linkInputPlaceholder: t('pdf_section.import_sources.link.placeholder'),
      buttonText: t('pdf_section.import_sources.link.button_text'),
      buttonHint: t('pdf_section.import_sources.link.button_hint')
    }
  ]

  const actionOptions: ActionOptionGroup = [
    [
      {
        type: 'button',
        Icon: <Icon.Copy />,
        onClick: () => {
          editor
            .chain()
            .setImageBlock(getPos() + node.nodeSize)
            .focus()
            .run()
        }
      }
    ],
    {
      type: 'button',
      Icon: <Icon.Delete />,
      onClick: handleDelete
    }
  ]

  return (
    <BlockContainer editor={editor} actionOptions={actionOptions}>
      <Popover
        overlayClassName="brickdoc-block-pdf-section-popover"
        trigger="click"
        placement="bottom"
        content={
          <Dashboard
            blockId={node.attrs.uuid}
            fileType="pdf"
            prepareFileUpload={editorDataSource.prepareFileUpload}
            onProgress={onProgress}
            onUploaded={onUploaded}
            importSources={importSources}
          />
        }
      >
        <Button type="text" className="brickdoc-block-pdf-section">
          <div className="pdf-section-progressing" style={{ width: `${progress?.percentage ?? 0}%` }} />
          <Icon.FilePdf className="pdf-section-icon" />
          <div className="pdf-section-content">
            {progress ? progress.name : t('pdf_section.hint')}
            {progress && (
              <div className="pdf-section-desc">
                {sizeFormat(progress.bytesTotal)} - {progress.percentage}%
              </div>
            )}
          </div>
        </Button>
      </Popover>
    </BlockContainer>
  )
}
