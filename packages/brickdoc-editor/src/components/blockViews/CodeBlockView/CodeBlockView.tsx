import { FC, useState } from 'react'
import { LineDown, Check } from '@brickdoc/design-icons'
import { Menu, Input, Popover, Switch, styled, theme } from '@brickdoc/design-system'
import { NodeViewContent } from '@tiptap/react'
import { BlockContainer } from '../BlockContainer'
import { highlightStyle, ViewModeBar, CodeContainer, CodeScroll, SwitchContainer } from './styles/highlight.style'
import { CodeBlockViewProps } from '../../../extensions/blocks/codeBlock/meta'
import { CodeBlockAttributes } from '../../../extensions'
import { languageNames } from '../../../extensions/blocks/codeBlock/refractorLanguagesBundle'
import { useOptions } from './useOptions'
import { useEditorContext } from '../../../hooks'

const LanguageChecked = styled(Check, {
  fontSize: '1rem',
  color: theme.colors.primaryDefault
})
const defaultLanguage = 'plain text'

interface ILanguageSelect {
  language: string | null
  updateAttributes: (attributes: Partial<CodeBlockAttributes>) => void
}

const LanguageSelect: FC<ILanguageSelect> = (props: ILanguageSelect) => {
  const { t } = useEditorContext()
  const { language, updateAttributes } = props

  const onAction = (key: string) => {
    if (key === 'search') {
      return
    }
    updateAttributes({
      language: key
    })
    setVisible(false)
  }
  const [search, setSearch] = useState<string | undefined>('')
  const [visible, setVisible] = useState(false)
  const handleVisibleChange = (visible: boolean): void => setVisible(visible)
  const menu = (
    <Menu type="ghost" style={{ maxHeight: 400, overflow: 'auto' }}>
      <Menu.Item key="search" itemKey="search">
        <Input
          bordered={false}
          placeholder={t('code_block.search_placeholder')}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </Menu.Item>
      {([defaultLanguage, ...languageNames] as string[])
        .filter(lang => lang.toLowerCase().includes(search?.toLowerCase() ?? ''))
        .map(name => (
          <Menu.Item
            key={name}
            itemKey={name}
            onAction={onAction}
            label={t(`code_block.languages.${name}`)}
            tip={name === language ? <LanguageChecked /> : undefined}
          />
        ))}
    </Menu>
  )
  const updateVisible = () => setVisible(state => !state)
  return (
    <Popover
      trigger="click"
      visible={visible}
      onVisibleChange={handleVisibleChange}
      placement="bottomStart"
      compact={true}
      getPopupContainer={element => element}
      content={menu}
      destroyTooltipOnHide={true}
    >
      <div role="tab" tabIndex={0} onClick={updateVisible} onKeyDown={updateVisible}>
        {t(`code_block.languages.${language}`)} <LineDown />
      </div>
    </Popover>
  )
}

export const CodeBlockView: FC<CodeBlockViewProps> = ({ node, updateAttributes, deleteNode, getPos }) => {
  const {
    attrs: { language, autoWrap: _autoWrap }
  } = node
  const autoWrap = _autoWrap !== false
  const onAutoWrapChange = () => {
    updateAttributes({
      autoWrap: !autoWrap
    })
  }
  const [actionOptions] = useOptions(node)

  return (
    <BlockContainer
      node={node}
      className={highlightStyle()}
      getPos={getPos}
      deleteNode={deleteNode}
      actionOptions={actionOptions}
    >
      <CodeContainer>
        <ViewModeBar>
          <LanguageSelect language={language ?? defaultLanguage} updateAttributes={updateAttributes} />
          <SwitchContainer>
            <span className="label">Auto Wrap</span>
            <Switch checked={!!autoWrap} size="sm" onChange={onAutoWrapChange} />
          </SwitchContainer>
        </ViewModeBar>
        <pre>
          <NodeViewContent className={autoWrap ? undefined : CodeScroll()} as="code" />
        </pre>
      </CodeContainer>
    </BlockContainer>
  )
}
