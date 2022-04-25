import { theme } from '@brickdoc/design-system'
import { globalCss } from '@stitches/react'

export const getNativeSidebarWdith = () => {
  const wrapper = window.document.createElement('div')
  wrapper.style.visibility = 'hidden'
  wrapper.style.width = '100px'
  window.document.body.appendChild(wrapper)
  const offset = wrapper.offsetWidth
  wrapper.style.overflow = 'scroll'
  const inner = window.document.createElement('div')
  inner.style.width = '100%'
  wrapper.appendChild(inner)
  const innerOffset = inner.offsetWidth
  const width = offset - innerOffset
  wrapper?.parentNode?.removeChild(wrapper)
  return width
}

const sidebarStyle = {
  '::-webkit-scrollbar': {
    width: 4,
    height: 4,
    background: 'transparent'
  },
  '::-webkit-scrollbar-track': {
    background: 'transparent'
  },
  '::-webkit-scrollbar-thumb': {
    background: theme.colors.overlayPrimary,
    '-webkit-border-radius': '4px'
  }
}

export const initBrickdocSidebarStyle = () => {
  try {
    if (getNativeSidebarWdith()) {
      globalCss(sidebarStyle)()
    }
  } catch (e) {
    console.warn(e)
  }
}
