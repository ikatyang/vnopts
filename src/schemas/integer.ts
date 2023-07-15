import { Utils, ValidateResult } from '../types.js'
import { isInt } from '../utils.js'
import { NumberSchema } from './number.js'

export class IntegerSchema extends NumberSchema {
  public expected() {
    return 'an integer'
  }
  public validate(value: unknown, utils: Utils): ValidateResult {
    return (
      utils.normalizeValidateResult(super.validate(value, utils), value) ===
        true && isInt(value as number)
    )
  }
}
