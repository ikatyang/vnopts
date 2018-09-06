import { Schema, SchemaHandlers } from '../schema';
import {
  DeprecatedResult,
  ExpectedResult,
  ForwardResult,
  NormalizedTransferResult,
  RedirectResult,
  Utils,
  ValidateResult,
} from '../types';

interface ArraySchemaParameters<$ValueSchema extends Schema<any>>
  extends SchemaHandlers<Array<$ValueSchema['_valueType']>> {
  name?: string;
  valueSchema: $ValueSchema;
}

export class ArraySchema<$ValueSchema extends Schema<any>> extends Schema<
  Array<$ValueSchema['_valueType']>,
  ArraySchemaParameters<$ValueSchema>
> {
  private _valueSchema: $ValueSchema;

  constructor({
    valueSchema,
    name = valueSchema.name,
    ...handlers
  }: ArraySchemaParameters<$ValueSchema>) {
    super({ ...handlers, name });
    this._valueSchema = valueSchema;
  }

  public expected(utils: Utils): ExpectedResult {
    const {
      description,
      valueTitle,
      valueDescriptions,
    } = utils.normalizeExpectedResult(this._valueSchema.expected(utils));

    return valueTitle
      ? {
          valueTitle: `an array of the following values`,
          valueDescriptions: [{ valueTitle, valueDescriptions }],
        }
      : { description: `an array of ${description}` };
  }

  public validate(value: unknown, utils: Utils): ValidateResult {
    if (!Array.isArray(value)) {
      return false;
    }

    const invalidValues: Array<unknown> = [];

    for (const subValue of value) {
      const subValidateResult = utils.normalizeValidateResult(
        this._valueSchema.validate(subValue, utils),
        subValue,
      );
      if (subValidateResult !== true) {
        invalidValues.push(subValidateResult.value);
      }
    }

    return invalidValues.length === 0 ? true : { value: invalidValues };
  }

  public deprecated(
    value: this['_valueType'],
    utils: Utils,
  ): DeprecatedResult<this['_valueType']> {
    const deprecatedResult: DeprecatedResult<this['_valueType']> = [];

    for (const subValue of value) {
      const subDeprecatedResult = utils.normalizeDeprecatedResult(
        this._valueSchema.deprecated(subValue, utils),
        subValue,
      );

      if (subDeprecatedResult !== false) {
        deprecatedResult.push(
          ...subDeprecatedResult.map(({ value: deprecatedValue }) => ({
            value: [deprecatedValue],
          })),
        );
      }
    }

    return deprecatedResult;
  }

  public forward(
    value: this['_valueType'],
    utils: Utils,
  ): ForwardResult<this['_valueType']> {
    const forwardResult: ForwardResult<this['_valueType']> = [];

    for (const subValue of value) {
      const subForwardResult = utils.normalizeForwardResult(
        this._valueSchema.forward(subValue, utils),
        subValue,
      );

      forwardResult.push(...subForwardResult.map(wrapTransferResult));
    }

    return forwardResult;
  }

  public redirect(
    value: this['_valueType'],
    utils: Utils,
  ): RedirectResult<this['_valueType']> {
    const remain: this['_valueType'] = [];
    const redirect: ForwardResult<this['_valueType']> = [];

    for (const subValue of value) {
      const subRedirectResult = utils.normalizeRedirectResult(
        this._valueSchema.redirect(subValue, utils),
        subValue,
      );

      if ('remain' in subRedirectResult) {
        remain.push(subRedirectResult.remain!);
      }

      redirect.push(...subRedirectResult.redirect.map(wrapTransferResult));
    }

    return remain.length === 0 ? { redirect } : { redirect, remain };
  }

  public overlap(
    currentValue: this['_valueType'],
    newValue: this['_valueType'],
  ): this['_valueType'] {
    return currentValue.concat(newValue);
  }
}

function wrapTransferResult<$Value>(
  { from, to }: NormalizedTransferResult<$Value>, //
): NormalizedTransferResult<$Value[]> {
  return { from: [from], to };
}
