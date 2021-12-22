import { ButtonInitializer, ButtonType } from '.'
import { FunctionContext, FunctionResult, functionResult2lambda, VariableMetadata } from '..'

export class ButtonClass implements ButtonType {
  name: string
  meta: VariableMetadata
  kind: 'Button' = 'Button'
  fn: FunctionResult
  disabled: boolean
  onClick?: () => void

  constructor(ctx: FunctionContext, { name, fn }: ButtonInitializer) {
    this.name = name
    this.meta = ctx.meta
    this.fn = fn
    this.disabled = false
    this.onClick = functionResult2lambda<ButtonType>(ctx, fn, this)
  }
}
