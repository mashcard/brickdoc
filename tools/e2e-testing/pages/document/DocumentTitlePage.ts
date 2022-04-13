import { DOCUMENT_TITLE_SELECTORS } from '@/selectors/document/documentTitle'
import { Locator } from '@playwright/test'
import { BasePage } from '../BasePage'
import { IconPage } from './IconPage'

export class DocumentTitlePage extends BasePage {
  getDocumentTitle(): Locator {
    return this.page.locator(DOCUMENT_TITLE_SELECTORS.documentTitle)
  }

  getDocumentEmoji(): Locator {
    return this.page.locator(DOCUMENT_TITLE_SELECTORS.documentEmoji)
  }

  getDocumentImageIcon(): Locator {
    return this.page.locator(DOCUMENT_TITLE_SELECTORS.documentImageIcon)
  }

  getActionButtons(): Locator {
    return this.page.locator(DOCUMENT_TITLE_SELECTORS.actionButtons)
  }

  getAddIconButton(): Locator {
    return this.page.locator(DOCUMENT_TITLE_SELECTORS.addIconButton)
  }

  getAddCoverButton(): Locator {
    return this.page.locator(DOCUMENT_TITLE_SELECTORS.addCoverButton)
  }

  async fillTitle(title: string): Promise<void> {
    await this.waitForResponseWithAction('blockSyncBatch', this.getDocumentTitle().fill(title))
  }

  async openIconPopup(): Promise<IconPage> {
    await this.getDocumentTitle().hover()
    await this.getAddIconButton().click()
    return new IconPage(this.page)
  }

  async reopenIconPopup(type: 'Emoji' | 'Image' = 'Emoji'): Promise<void> {
    type === 'Emoji' ? await this.getDocumentEmoji().click() : await this.getDocumentImageIcon().click()
  }
}
