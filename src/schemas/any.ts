import { Schema, SchemaParameters } from '../schema';
import { ValidateResult } from '../types';

export class AnySchema extends Schema<any, SchemaParameters<any>> {
  public expected() {
    return 'anything';
  }
  public validate(): ValidateResult {
    return true;
  }
}
