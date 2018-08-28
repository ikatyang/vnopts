import { Schema, SchemaParameters } from '../schema';
import { Utils, ValidateResult } from '../types';

export class NumberSchema extends Schema<number, SchemaParameters<number>> {
  public expected() {
    return 'a number';
  }
  public validate(value: unknown, _utils: Utils): ValidateResult {
    return typeof value === 'number';
  }
}
