import { Button, toast } from '@brickdoc/design-system'
import { TEST_ID_ENUM } from '@brickdoc/test-helper'
import React from 'react'
import { ImportSourceOption } from './Dashboard'
import { DashboardPluginOptions } from './plugin'
import { isValidImageUrl } from './checkImageUrl'

interface LinkPanelProps {
  importSource: ImportSourceOption
  pluginOptions: DashboardPluginOptions
}

export const LinkPanel: React.FC<LinkPanelProps> = ({ importSource, pluginOptions }) => {
  const link = React.useRef<string>()
  const handleLinkInput = (event: React.ChangeEvent<HTMLInputElement>): void => {
    link.current = event.target.value
  }

  const handleLinkSubmit = async (): Promise<void> => {
    if (!link.current) {
      return
    }
    const isLinkValid = await isValidImageUrl(link.current)
    if (!isLinkValid) {
      importSource.invalidImageUrlMessage && toast.error(importSource.invalidImageUrlMessage)
      return
    }

    await pluginOptions.onUploaded?.({ action: 'add', url: link.current, meta: { source: 'external' } })
  }

  return (
    <div className="uploader-dashboard-link-panel">
      <input
        data-testid={TEST_ID_ENUM.uploader.Dashboard.modules.link.input.id}
        onChange={handleLinkInput}
        className="dashboard-link-panel-input"
        placeholder={importSource.linkInputPlaceholder}
      />
      <Button
        type="primary"
        data-testid={TEST_ID_ENUM.uploader.Dashboard.modules.link.button.id}
        onClick={handleLinkSubmit}
        className="dashboard-panel-button"
      >
        {importSource.buttonText}
      </Button>
      <div className="dashboard-panel-hint">{importSource.buttonHint}</div>
    </div>
  )
}
