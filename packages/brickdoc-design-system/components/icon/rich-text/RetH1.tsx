import React from 'react'
import { Icon, IconProps } from '../Icon'
import { ReactComponent as SvgIcon } from './assets/rte-h1.svgr'

export const RteH1: React.FC<IconProps> = props => {
  return (
    <Icon {...props}>
      <SvgIcon />
    </Icon>
  )
}
