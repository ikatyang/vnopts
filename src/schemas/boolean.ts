import { Schema, SchemaParameters } from '../schema';
import { ValidateResult } from '../types';

export class BooleanSchema extends Schema<boolean, SchemaParameters<boolean>> {
  public expected() {
    return 'true or false';
  }
  public validate(value: unknown): ValidateResult {
    return typeof value === 'boolean';
  }
}
