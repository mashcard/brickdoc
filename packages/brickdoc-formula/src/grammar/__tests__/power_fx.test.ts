import { parse, interpret } from '../api'
import { FormulaContext } from '../../context'
import { Row, ColumnInitializer, SpreadsheetType, SpreadsheetClass } from '../../controls'

const namespaceId = '57622108-1337-4edd-833a-2557835bcfe0'
const variableId = '481b6dd1-e668-4477-9e47-cfe5cb1239d0'
const spreadsheetNamespaceId = '28e28190-63bd-4f70-aeca-26e72574c01a'

const firstColumnId = '62d9a9ee-88a1-46c7-a929-4a0d9dc0a4d6'
const secondColumnId = '4e6f9adb-6f33-454e-9f9e-635dc98e3f28'
const thirdColumnId = '2723b7d9-22ce-4d93-b2ef-7cce1b122d64'
const firstRowId = 'ec4fdfe8-4a12-4a76-aeae-2dea0229e734'
const secondRowId = '5d1e4a83-383a-4991-a33c-52a9b3169549'
const thirdRowId = '05f5ae67-b982-406e-a92f-e559c10a7ba6'

const meta = { namespaceId, variableId, name: 'example' }

const spreadsheetData: Row[] = [
  { id: firstRowId, [firstColumnId]: '1', [secondColumnId]: '2', [thirdColumnId]: '3', sort: '100' },
  { id: secondRowId, [firstColumnId]: '3', [secondColumnId]: '4', [thirdColumnId]: '', sort: '100' },
  { id: thirdRowId, [firstColumnId]: '5', [secondColumnId]: '6', [thirdColumnId]: 'Foo', sort: '100' }
]
const columns: ColumnInitializer[] = [
  {
    columnId: firstColumnId,
    namespaceId: spreadsheetNamespaceId,
    type: 'text',
    name: 'first',
    index: 0,
    rows: spreadsheetData.map(row => row[firstColumnId])
  },
  {
    columnId: secondColumnId,
    namespaceId: spreadsheetNamespaceId,
    type: 'text',
    name: 'second',
    index: 1,
    rows: spreadsheetData.map(row => row[secondColumnId])
  },
  {
    columnId: thirdColumnId,
    namespaceId: spreadsheetNamespaceId,
    type: 'text',
    name: 'third',
    index: 2,
    rows: spreadsheetData.map(row => row[thirdColumnId])
  }
]

const spreadsheet: SpreadsheetType = new SpreadsheetClass({
  name: 'MySpreadsheet',
  dynamic: false,
  ctx: { formulaContext: new FormulaContext({}) },
  blockId: spreadsheetNamespaceId,
  listColumns: () => columns,
  listRows: () => spreadsheetData
})

interface TestCase {
  input: string
  label: string
  value: any
}

const SNAPSHOT_FLAG = '<SNAPSHOT>'

const testCases: TestCase[] = [
  {
    label: 'CountIf ok',
    input: `=CountIf(#${spreadsheetNamespaceId}, #${spreadsheetNamespaceId}#${firstColumnId} >= 3)`,
    value: 2
  },
  {
    label: 'CountIf error1',
    input: `=CountIf(#${spreadsheetNamespaceId}, >= 3)`,
    value: 'Column is missing'
  }
]

describe('Power Fx Functions', () => {
  const formulaContext = new FormulaContext({})
  formulaContext.setSpreadsheet(spreadsheetNamespaceId, spreadsheet)
  const ctx = { formulaContext, meta, interpretContext: { ctx: {}, arguments: [] } }

  testCases.forEach(({ input, label, value }) => {
    it(`[${label}] ${input}`, async () => {
      const newMeta = { ...meta, input }
      const newCtx = { ...ctx, meta: newMeta }
      const { codeFragments, cst, errorMessages } = parse({ ctx: newCtx })
      expect(errorMessages).toEqual([])
      expect(codeFragments).toMatchSnapshot()
      const result = (await interpret({ cst: cst!, ctx: newCtx })).variableValue.result.result
      if (value === SNAPSHOT_FLAG) {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(result).toMatchSnapshot()
      } else {
        // eslint-disable-next-line jest/no-conditional-expect
        expect(result).toEqual(value)
      }
    })
  })
})
