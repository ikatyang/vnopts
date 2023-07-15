import { Schema, SchemaParameters } from '../schema.js'
import { Utils, ValidateResult } from '../types.js'

export class NumberSchema extends Schema<number, SchemaParameters<number>> {
  public expected() {
    return 'a number'
  }
  public validate(value: unknown, _utils: Utils): ValidateResult {
    return typeof value === 'number'
  }
}
