import { VALUE_NOT_EXIST, VALUE_UNCHANGED } from './constants';
import {
  DefaultResult,
  DeprecatedResult,
  ExpectedResult,
  ForwardResult,
  OptionValue,
  RedirectResult,
  Utils,
  ValidateResult,
} from './types';

export interface SchemaParameters<$Value> extends SchemaHandlers<$Value> {
  name: string;
}

export interface SchemaHandlers<$Value> {
  default?:
    | DefaultResult<$Value>
    | ((schema: Schema<$Value>, utils: Utils) => DefaultResult<$Value>);
  expected?:
    | ExpectedResult
    | ((schema: Schema<$Value>, utils: Utils) => ExpectedResult);
  validate?:
    | ValidateResult
    | ((
        value: unknown,
        schema: Schema<$Value>,
        utils: Utils,
      ) => ValidateResult);
  deprecated?:
    | DeprecatedResult<$Value>
    | ((
        value: $Value,
        schema: Schema<$Value>,
        utils: Utils,
      ) => DeprecatedResult<$Value>);
  forward?:
    | ForwardResult<$Value>
    | ((
        value: $Value,
        schema: Schema<$Value>,
        utils: Utils,
      ) => ForwardResult<$Value>);
  redirect?:
    | RedirectResult<$Value>
    | ((
        value: $Value,
        schema: Schema<$Value>,
        utils: Utils,
      ) => RedirectResult<$Value>);
  overlap?: (
    currentValue: $Value,
    newValue: $Value,
    schema: Schema<$Value>,
    utils: Utils,
  ) => $Value;
  preprocess?: (
    value: unknown,
    schema: Schema<$Value>,
    utils: Utils,
  ) => unknown;
  postprocess?: (
    value: $Value,
    schema: Schema<$Value>,
    utils: Utils,
  ) => unknown;
}

const HANDLER_KEYS: Array<keyof SchemaHandlers<any>> = [
  'default',
  'expected',
  'validate',
  'deprecated',
  'forward',
  'redirect',
  'overlap',
  'preprocess',
  'postprocess',
];

export function createSchema<
  $Schema extends Schema<any>,
  $Parameters extends $Schema['_parametersType']
>(
  SchemaConstructor: new (parameters: $Parameters) => $Schema,
  parameters: $Parameters,
) {
  const schema = new SchemaConstructor(parameters);
  const subSchema = Object.create(schema) as $Schema;

  for (const handlerKey of HANDLER_KEYS) {
    if (handlerKey in parameters) {
      subSchema[handlerKey] = normalizeHandler(
        parameters[handlerKey],
        schema,
        Schema.prototype[handlerKey].length,
      );
    }
  }

  return subSchema;
}

export abstract class Schema<
  $Value extends OptionValue,
  $Parameters extends SchemaHandlers<$Value> = SchemaHandlers<$Value>
> {
  public static create<$Schema extends Schema<any>>(
    parameters: $Schema['_parametersType'],
  ): $Schema {
    // @ts-ignore: https://github.com/Microsoft/TypeScript/issues/5863
    return createSchema(this, parameters);
  }

  public name: string;

  public _valueType!: $Value;
  public _parametersType!: $Parameters;

  constructor(parameters: SchemaParameters<$Value>) {
    this.name = parameters.name;
  }

  public default(_utils: Utils): DefaultResult<$Value> {
    return VALUE_NOT_EXIST;
  }

  // istanbul ignore next: this is actually an abstract method but we need a placeholder to get `function.length`
  public expected(_utils: Utils): ExpectedResult {
    return 'nothing';
  }

  // istanbul ignore next: this is actually an abstract method but we need a placeholder to get `function.length`
  public validate(_value: unknown, _utils: Utils): ValidateResult {
    return false;
  }

  public deprecated(_value: $Value, _utils: Utils): DeprecatedResult<$Value> {
    return false;
  }

  public forward(_value: $Value, _utils: Utils): ForwardResult<$Value> {
    return undefined;
  }

  public redirect(_value: $Value, _utils: Utils): RedirectResult<$Value> {
    return undefined;
  }

  public overlap(
    currentValue: $Value,
    _newValue: $Value,
    _utils: Utils,
  ): $Value {
    return currentValue;
  }

  public preprocess(value: unknown, _utils: Utils): any {
    return value;
  }

  public postprocess(_value: $Value, _utils: Utils): any {
    return VALUE_UNCHANGED;
  }
}

function normalizeHandler<$Result>(
  handler: $Result | ((...args: any[]) => $Result),
  superSchema: Schema<any>,
  handlerArgumentsLength: number,
) {
  return typeof handler === 'function'
    ? (...args: any[]) =>
        handler(
          ...args.slice(0, handlerArgumentsLength - 1),
          superSchema,
          ...args.slice(handlerArgumentsLength - 1),
        )
    : () => handler;
}
