declare global {
  interface BrickdocServerContext {
    internalApiEndpoint: string
    currentUser?: {
      webid: string
    }
    currentPod: {
      webid: string
    }
    lastBlockIds?: {
      [webid: string]: string
    }
    lastWebid?: string
    env: string
    version: string
    locale: string
    rtl: boolean
    timezone: string
    defaultTimezone: string
    host: string
    selfHost: boolean
    csrfToken: string
    isDesktopApp: boolean
    featureFlags: string[]
    serverMessage: string
    sentryDsn: string
  }
  interface BrickdocClientContext {
    wsCable: ActionCable.Consumer
    uuid: string
  }
  type BrickdocContext = BrickdocServerContext & BrickdocClientContext

  // eslint-disable-next-line no-inner-declarations, no-var
  var brickdocContext: BrickdocContext
}

export {}
