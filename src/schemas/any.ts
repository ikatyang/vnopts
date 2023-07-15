import { Schema, SchemaParameters } from '../schema.js'
import { ValidateResult } from '../types.js'

export class AnySchema extends Schema<any, SchemaParameters<any>> {
  public expected() {
    return 'anything'
  }
  public validate(): ValidateResult {
    return true
  }
}
