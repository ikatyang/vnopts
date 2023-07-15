import { Schema, SchemaParameters } from '../schema.js'
import { ValidateResult } from '../types.js'

export class StringSchema extends Schema<string, SchemaParameters<string>> {
  public expected() {
    return 'a string'
  }
  public validate(value: unknown): ValidateResult {
    return typeof value === 'string'
  }
}
