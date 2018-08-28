import { Utils, ValidateResult } from '../types';
import { isInt } from '../utils';
import { NumberSchema } from './number';

export class IntegerSchema extends NumberSchema {
  public expected() {
    return 'an integer';
  }
  public validate(value: unknown, utils: Utils): ValidateResult {
    return (
      utils.normalizeValidateResult(super.validate(value, utils), value) ===
        true && isInt(value as number)
    );
  }
}
