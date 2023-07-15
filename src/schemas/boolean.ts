import { Schema, SchemaParameters } from '../schema.js'
import { ValidateResult } from '../types.js'

export class BooleanSchema extends Schema<boolean, SchemaParameters<boolean>> {
  public expected() {
    return 'true or false'
  }
  public validate(value: unknown): ValidateResult {
    return typeof value === 'boolean'
  }
}
