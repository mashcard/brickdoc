import React from 'react'
import { Button, Popover, Icon, Input } from '@brickdoc/design-system'
import styles from './DocumentTitle.module.less'
import { TEST_ID_ENUM } from '@brickdoc/test-helper'
import { DocumentIcon } from './DocumentIcon'
import { DocumentCover } from './DocumentCover'
import { useDocsI18n } from '../../../common/hooks'
import {
  useDocumentIconUploader,
  useDocumentCoverUploader,
  usePrepareFileUpload,
  useFetchUnsplashImages
} from '../../hooks'
import { useReactiveVar } from '@apollo/client'
import { editorVar } from '@/docs/reactiveVars'
import { useBlobGetter } from '../../hooks/useBlobGetter'
import { GetChildrenBlocksQuery } from '@/BrickdocGraphQL'
import { EditorContentProps } from '@brickdoc/editor'

export interface DocumentTitleProps {
  blocks: GetChildrenBlocksQuery['childrenBlocks']
  editable: boolean
}

const createDocAttrsUpdater =
  (editor: EditorContentProps['editor'], field: string) =>
  (value: any): void => {
    if (!editor || editor.isDestroyed) return
    editor.commands.setDocAttrs({
      ...editor.state.doc.attrs,
      [field]: value
    })
  }

export const DocumentTitle: React.FC<DocumentTitleProps> = ({ editable, blocks }) => {
  const { t } = useDocsI18n()
  const editor = useReactiveVar(editorVar)
  const blockId = editor?.state.doc.attrs.uuid
  const icon = editor?.state.doc.attrs.icon
  const cover = editor?.state.doc.attrs.cover
  const title = editor?.state.doc.attrs.title

  const docIconGetter = useBlobGetter('icon', blocks)
  const docCoverGetter = useBlobGetter('cover', blocks)

  const setTitle = createDocAttrsUpdater(editor, 'title')
  const setIcon = createDocAttrsUpdater(editor, 'icon')
  const setCover = createDocAttrsUpdater(editor, 'cover')

  const getDocIconUrl = (): string | undefined => {
    if (!editor || editor.isDestroyed) return undefined
    return docIconGetter(editor.state.doc)
  }
  const getDocCoverUrl = (): string | undefined => {
    if (!editor || editor.isDestroyed) return undefined
    return docCoverGetter(editor.state.doc)
  }

  const prepareFileUpload = usePrepareFileUpload()
  const fetchUnsplashImages = useFetchUnsplashImages()
  const [localIcon, setLocalIcon] = React.useState('')
  const [localCover, setLocalCover] = React.useState('')
  const [documentIconMeta, iconPopoverProps] = useDocumentIconUploader(icon, {
    blockId,
    prepareFileUpload,
    fetchUnsplashImages,
    styles,
    onChange: setIcon,
    onFileLoaded: setLocalIcon
  })
  const [documentCoverMeta, coverPopoverProps] = useDocumentCoverUploader(cover, {
    blockId,
    prepareFileUpload,
    fetchUnsplashImages,
    styles,
    onChange: setCover,
    onFileLoaded: setLocalCover
  })

  return (
    <>
      <DocumentCover
        editable={editable}
        localUrl={localCover}
        getDocCoverUrl={getDocCoverUrl}
        documentCoverMeta={documentCoverMeta}
        popoverProps={coverPopoverProps}
      />

      <div className={styles.titleWrapper}>
        <div className={styles.maxWidth}>
          {editable && (
            <div className={styles.actions}>
              {!documentIconMeta && (
                <Popover {...iconPopoverProps}>
                  <Button type="text" className={styles.item} disabled={!editable}>
                    <Icon.Face className={styles.icon} />
                    <span className={styles.name}>{t('title.add_icon')}</span>
                  </Button>
                </Popover>
              )}
              {!documentCoverMeta && (
                <Popover {...coverPopoverProps}>
                  <Button
                    data-testid={TEST_ID_ENUM.page.DocumentPage.coverButton.id}
                    type="text"
                    className={styles.item}
                    disabled={!editable}>
                    <Icon.Image className={styles.icon} />
                    <span className={styles.name}>{t('title.add_cover')}</span>
                  </Button>
                </Popover>
              )}
            </div>
          )}
          <div className={styles.titleRow}>
            {documentIconMeta && (
              <Popover {...iconPopoverProps} visible={!editable ? false : undefined}>
                <DocumentIcon getDocIconUrl={getDocIconUrl} localUrl={localIcon} documentIconMeta={documentIconMeta} />
              </Popover>
            )}
            <Input
              data-testid={TEST_ID_ENUM.page.DocumentPage.titleInput.id}
              className={styles.titleInput}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={t('title.untitled')}
              disabled={!editable}
            />
          </div>
        </div>
      </div>
    </>
  )
}
