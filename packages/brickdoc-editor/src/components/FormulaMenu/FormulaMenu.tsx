import React from 'react'
import { Button, Input, Modal, Popover } from '@brickdoc/design-system'
import {
  buildVariable,
  CodeFragment,
  Completion,
  ContextInterface,
  ErrorMessage,
  interpret,
  InterpretResult,
  parse,
  ParseResult,
  VariableInterface,
  View
} from '@brickdoc/formula'
import { v4 as uuid } from 'uuid'
import { useEditorI18n } from '../../hooks'
import './FormulaMenu.less'
import { Editor, JSONContent } from '@tiptap/core'
import { FormulaBlockProps } from '../../extensions/formula/FormulaBlock'
import { AutocompleteList } from './AutocompleteList/AutocompleteList'
import { FormulaEditor } from '../../extensions/formula/FormulaEditor/FormulaEditor'
import { codeFragmentsToJSONContent } from '../../helpers/formula'
import { useKeydownHandler } from './useKeyDownHandler'
import { debounce } from 'lodash'
import { EditorDataSourceContext } from '../../dataSource/DataSource'

export interface FormulaMenuProps {
  getPos?: () => number
  node?: FormulaBlockProps['node']
  defaultVisible?: boolean
  onVisibleChange?: (visible: boolean) => void
  editor: Editor
  variable?: VariableInterface
  updateVariable?: React.Dispatch<React.SetStateAction<VariableInterface | undefined>>
  updateFormula?: (id: string) => void
  clear?: boolean
}

const i18nKey = 'formula.menu'

const calculate = debounce(
  async ({
    namespaceId,
    variable,
    name,
    input,
    formulaContext
  }: {
    namespaceId: string
    variable: VariableInterface | undefined
    name: string
    input: string
    formulaContext: ContextInterface
  }): Promise<{
    completions: Completion[]
    newVariable: VariableInterface
    errors: ErrorMessage[]
    parseResult: ParseResult
    interpretResult: InterpretResult
  }> => {
    const variableId = variable ? variable.t.variableId : uuid()
    const meta = { namespaceId, variableId, name, input }
    const view: View = {}
    const parseInput = { formulaContext, meta }
    const parseResult = parse(parseInput)

    console.log({ parseResult, input })

    const completions = parseResult.completions

    let interpretResult: InterpretResult

    if (parseResult.success) {
      interpretResult = await interpret({ cst: parseResult.cst, formulaContext, meta })
    } else {
      interpretResult = {
        success: false,
        errorMessages: parseResult.errorMessages,
        result: { success: false, errorMessages: parseResult.errorMessages, updatedAt: new Date() }
      }
    }

    const newVariable = buildVariable({ formulaContext, meta, parseResult, interpretResult, view })
    const errors = [...parseResult.errorMessages, ...interpretResult.errorMessages]

    return {
      completions,
      newVariable,
      errors,
      parseResult,
      interpretResult
    }
  },
  300
)

export const FormulaMenu: React.FC<FormulaMenuProps> = ({
  getPos,
  node,
  children,
  defaultVisible,
  onVisibleChange,
  variable,
  editor,
  updateFormula,
  updateVariable,
  clear
}) => {
  const { t } = useEditorI18n()
  const editorDataSource = React.useContext(EditorDataSourceContext)
  const rootId = editorDataSource.rootId
  const formulaContext = editorDataSource.formulaContext

  const contextDefaultName = formulaContext ? formulaContext.getDefaultVariableName(rootId, 'any') : ''
  const contextCompletions = formulaContext ? formulaContext.completions(rootId, variable?.t.variableId) : []
  const formulaValue = variable?.t.valid
    ? `=${variable.t.codeFragments.map(fragment => fragment.name).join('')}`
    : variable?.t.definition
  const definition = formulaValue?.substring(1)

  const codeFragments = variable?.t.codeFragments
  const defaultContent = variable?.t.valid
    ? codeFragmentsToJSONContent(codeFragments)
    : { type: 'doc', content: [{ type: 'text', text: definition }] }

  const [completions, setCompletions] = React.useState(contextCompletions)

  const [name, setName] = React.useState(variable?.t.name)
  const [defaultName, setDefaultName] = React.useState(contextDefaultName)
  const [input, setInput] = React.useState(definition)

  const [error, setError] = React.useState<ErrorMessage | undefined>()
  const [visible, setVisible] = React.useState(defaultVisible)
  const [content, setContent] = React.useState<JSONContent | undefined>(defaultContent)
  const [activeCompletion, setActiveCompletion] = React.useState<Completion | undefined>(completions[0])
  const [activeCompletionIndex, setActiveCompletionIndex] = React.useState<number>(0)

  const close = (): void => {
    if (clear) {
      setContent(defaultContent)
      setName(variable?.t.name)
      setDefaultName(contextDefaultName)
      setCompletions(contextCompletions)
      setInput(definition)
      setActiveCompletion(completions[0])
      setActiveCompletionIndex(0)
      setError(undefined)
    }
    setVisible(false)
    onVisibleChange?.(false)
  }

  const onPopoverVisibleChange = (visible: boolean): void => {
    onVisibleChange?.(visible)

    if (!visible) {
      close()
      return
    }
    setVisible(visible)
  }

  const handleSelectActiveCompletion = (completion?: Completion): void => {
    const currentCompletion = completion ?? activeCompletion

    if (!currentCompletion) {
      return
    }
    const oldContent = content?.content ?? []
    const value = currentCompletion.value
    const attrs: CodeFragment =
      currentCompletion.kind === 'function'
        ? { meta: {}, errors: [], name: value, code: 'Function', spaceBefore: false, spaceAfter: false, type: 'any' }
        : {
            meta: { name: currentCompletion.preview.name },
            errors: [],
            name: value,
            code: 'Variable',
            spaceBefore: false,
            spaceAfter: false,
            type: 'any'
          }
    const completionContents: JSONContent[] = [
      { type: 'codeFragmentBlock', attrs, content: [{ type: 'text', text: value }] }
    ]
    const newContent = [...oldContent, ...completionContents]
    const finalContent = { type: 'doc', content: newContent }
    const finalInput = contentToInput(finalContent)
    setContent(finalContent)
    setInput(finalInput)
    console.log({ currentCompletion, content, attrs, label: 'selectCompletion', newContent, finalInput })
    void doCalculate({ newInput: finalInput })
  }
  const keyDownHandler = useKeydownHandler({
    completions,
    activeCompletion,
    activeCompletionIndex,
    handleSelectActiveCompletion,
    setActiveCompletion,
    setActiveCompletionIndex
  })

  const contentToInput = (content: JSONContent): string => {
    const newInput =
      content.content?.map((c: JSONContent) => (c.type === 'text' ? c.text : c.content?.[0].text ?? '')).join('') ?? ''
    return `=${newInput}`
  }

  const handleValueChange = (editor: Editor): void => {
    const text = contentToInput(editor.getJSON().content[0])
    console.log({ content, json: editor.getJSON(), editor, text, label: 'updateValue' })
    setInput(text)
    setContent(editor.getJSON() as JSONContent)
    void doCalculate({ newInput: text })
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setName(e.target.value)
    void doCalculate({ newName: e.target.value })
  }

  const doCalculate = async ({ newName, newInput }: { newName?: string; newInput?: string }): Promise<void> => {
    const finalName = newName ?? name ?? defaultName
    const finalInput = newInput ?? input ?? ''
    console.log({ finalName, newName, newInput, input, finalInput })

    if (!formulaContext || !finalInput) return

    const result = await calculate({
      namespaceId: rootId,
      variable,
      name: finalName,
      input: finalInput,
      formulaContext
    })

    if (!result) return

    const { interpretResult, parseResult, completions, newVariable, errors } = result

    if (parseResult.valid) {
      setContent(codeFragmentsToJSONContent(parseResult.codeFragments))
      setInput(parseResult.codeFragments.map(fragment => fragment.name).join(''))
    }

    updateVariable?.(newVariable)
    setCompletions(completions)
    setActiveCompletion(completions[0])
    setError(errors.length ? errors[0] : undefined)

    if (interpretResult.success) {
      const type = interpretResult.result.type
      setDefaultName(formulaContext.getDefaultVariableName(rootId, type))
    }
  }

  const handleSave = async (): Promise<void> => {
    if (!(name ?? defaultName) || !input || !variable) return
    if (!formulaContext) return

    if (updateFormula) {
      updateFormula(variable.t.variableId)
    } else {
      editor.chain().setFormula(variable.t.variableId).focus().run()
    }
    const finalName = name ?? defaultName
    variable.t.name = finalName
    await formulaContext.commitVariable({ variable })
    setName(finalName)
    updateVariable?.(variable)

    console.log({ label: 'save ...', input, variable, updateVariable, formulaContext })
    close()
  }

  const handleCancel = (): void => {
    close()
  }

  const handleDelete = (): void => {
    Modal.confirm({
      title: t(`${i18nKey}.delete_confirm.title`),
      okText: t(`${i18nKey}.delete_confirm.ok`),
      okButtonProps: { danger: true },
      cancelText: t(`${i18nKey}.delete_confirm.cancel`),
      icon: null,
      onOk: async () => {
        if (!variable || !getPos || !node) return
        const position = getPos()
        void (await formulaContext?.removeVariable(rootId, variable.t.variableId))
        editor.commands.deleteRange({ from: position, to: position + node.nodeSize })
      }
    })
  }

  const menu = (
    <div className="brickdoc-formula-menu">
      <div className="formula-menu-header">{t(`${i18nKey}.header`)}</div>
      <div className="formula-menu-row">
        <div className="formula-menu-item">
          <label className="formula-menu-label">
            <span className="formula-menu-label-text">{t(`${i18nKey}.name`)}</span>
            <Input className="formula-menu-field" placeholder={defaultName} value={name} onChange={handleNameChange} />
          </label>
        </div>
      </div>
      <div className="formula-menu-row">
        <div className="formula-menu-item">
          <FormulaEditor
            content={content}
            updateContent={handleValueChange}
            keyDownHandler={keyDownHandler}
            editable={true}
          />
        </div>
      </div>
      <div className="formula-menu-divider" />
      <div className="formula-menu-result">
        <span className="formula-menu-result-label">=</span>
        {error && (
          <span className="formula-menu-result-error">
            <span className="formula-menu-result-error-type">{error.type}</span>
            <span className="formula-menu-result-error-message">{error.message}</span>
          </span>
        )}
        {!error && variable?.t.variableValue.display}
      </div>
      <div className="formula-menu-divider" />
      <AutocompleteList
        completions={completions}
        handleSelectActiveCompletion={handleSelectActiveCompletion}
        setActiveCompletion={setActiveCompletion}
        activeCompletionIndex={activeCompletionIndex}
        setActiveCompletionIndex={setActiveCompletionIndex}
        activeCompletion={activeCompletion}
      />
      <div className="formula-menu-footer">
        <Button className="formula-menu-button" size="small" type="text" onClick={handleCancel}>
          {t(`${i18nKey}.cancel`)}
        </Button>
        <Button className="formula-menu-button" size="small" type="primary" onClick={handleSave}>
          {t(`${i18nKey}.save`)}
        </Button>
        {node && (
          <Button className="formula-menu-button" size="small" type="text" danger={true} onClick={handleDelete}>
            {t(`${i18nKey}.delete`)}
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <Popover
      onVisibleChange={onPopoverVisibleChange}
      defaultVisible={defaultVisible}
      visible={visible}
      overlayClassName="brickdoc-formula-menu-popover"
      destroyTooltipOnHide={true}
      content={menu}
      placement="bottom"
      trigger={['click']}>
      {children}
    </Popover>
  )
}
