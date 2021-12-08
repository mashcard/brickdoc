import { FormulaContext } from '../../context'
import { START_WITH } from '../string'

const ctx = new FormulaContext()

describe('object', () => {
  it('START_WITH', () => {
    expect(START_WITH(ctx, 'foo', 'bar').result).toBe(false)
    expect(START_WITH(ctx, 'foo', 'foo').result).toBe(true)
  })
})
