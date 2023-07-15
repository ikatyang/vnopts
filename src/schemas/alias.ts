import { Schema, SchemaParameters } from '../schema.js'
import { RedirectResult, Utils, ValidateResult } from '../types.js'

interface AliasSchemaParameters extends SchemaParameters<any> {
  sourceName: string
}

export class AliasSchema extends Schema<any, AliasSchemaParameters> {
  private _sourceName: string

  constructor(parameters: AliasSchemaParameters) {
    super(parameters)
    this._sourceName = parameters.sourceName
  }

  public expected(utils: Utils) {
    return utils.schemas[this._sourceName].expected(utils)
  }

  public validate(value: unknown, utils: Utils): ValidateResult {
    return utils.schemas[this._sourceName].validate(value, utils)
  }

  public redirect(
    _value: this['_valueType'],
    _utils: Utils,
  ): RedirectResult<this['_valueType']> {
    return this._sourceName
  }
}
