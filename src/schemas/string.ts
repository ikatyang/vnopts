import { Schema, SchemaParameters } from '../schema';
import { ValidateResult } from '../types';

export class StringSchema extends Schema<string, SchemaParameters<string>> {
  public expected() {
    return 'a string';
  }
  public validate(value: unknown): ValidateResult {
    return typeof value === 'string';
  }
}
