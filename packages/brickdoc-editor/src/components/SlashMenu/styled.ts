import { Icon, Menu, menuItemSpacing, styled, theme } from '@brickdoc/design-system'

const footerHeight = '2rem'

export const StyledSlashMenu = styled(Menu, {
  maxHeight: 'inherit',
  overflow: 'auto',
  paddingBottom: footerHeight,
  variants: {
    withFooter: {
      true: {
        paddingBottom: footerHeight
      },
      false: {
        paddingBottom: 0
      }
    }
  }
})

export const SlashMenuGroupLabel = styled('span', {
  color: theme.colors.typeThirdary,
  fontSize: theme.fontSizes.callout
})

export const iconBackground = {
  background: 'linear-gradient(0deg, rgba(248, 251, 255, 0.36), rgba(248, 251, 255, 0.36)), rgba(255, 255, 255, 0.74)',
  backdropFilter: 'blur(16px)',
  borderRadius: '2px',
  boxShadow:
    '1px 1px 0px rgba(255, 255, 255, 0.8), 0px 2px 4px rgba(167, 167, 167, 0.3), inset 1px 1px 0px rgba(255, 255, 255, 0.25)'
}

export const MenuIcon = styled('span', {
  include: ['flexCenter'],
  ...iconBackground,
  display: 'flex',
  fontSize: '.8125rem',
  height: '1.3rem',
  width: '1.3rem'
})

export const RecentItem = styled(Menu.Item, {
  include: ['flexCenter'],
  borderRadius: '4px',
  display: 'flex',
  minHeight: 'unset',
  minWidth: 'unset',
  padding: '5px'
})

export const RecentItemIconContainer = styled('span', {
  include: ['flexCenter'],
  ...iconBackground,
  display: 'flex',
  height: '1.6rem',
  width: '1.6rem'
})

export const RecentGroup = styled(Menu.Group, {
  alignItems: 'center',
  display: 'flex',
  flexDirection: 'row',
  margin: '.625rem 0',
  padding: `0 ${menuItemSpacing}`,
  [`${RecentItem} + ${RecentItem}`]: {
    marginLeft: '.9rem'
  }
})

export const Shortcut = styled('kbd', {
  border: `1px solid ${theme.colors.borderPrimary}`,
  borderRadius: '4px',
  color: theme.colors.typeDisabled,
  fontSize: '.875rem',
  lineHeight: '1em',
  padding: '.25rem'
})

export const Footer = styled('div', {
  alignItems: 'center',
  background: theme.colors.ceramicSecondary,
  bottom: 0,
  color: theme.colors.typeThirdary,
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'row',
  fontSize: theme.fontSizes.callout,
  height: footerHeight,
  justifyContent: 'space-between',
  left: 0,
  padding: `0 ${menuItemSpacing}`,
  position: 'absolute',
  right: 0,
  zIndex: 1
})

export const ExploreItem = styled('div', {
  alignItems: 'center',
  color: theme.colors.typeThirdary,
  display: 'flex',
  fontSize: theme.fontSizes.callout,
  justifyContent: 'space-between',
  width: '100%'
})

export const ExploreIcon = styled(Icon.HamburgerButton, {
  color: theme.colors.iconDisable,
  fontSize: '1rem'
})
