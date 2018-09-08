import {
  DefaultResult,
  DeprecatedResult,
  ExpectedResult,
  ForwardResult,
  InvalidHandler,
  NormalizedDefaultResult,
  NormalizedDeprecatedResult,
  NormalizedDeprecatedResultWithTrue,
  NormalizedExpectedResult,
  NormalizedForwardResult,
  NormalizedInvalidHandler,
  NormalizedRedirectResult,
  NormalizedTransferResult,
  NormalizedValidateResult,
  Options,
  RedirectResult,
  TransferResult,
  ValidateResult,
} from './types';

export type NotEmptyArray<T> = [T, ...T[]];

export type RecordFromUnion<T extends Options, K extends keyof T> = {
  [X in T[K]]: Extract<T, Record<K, X>>
};

export function recordFromArray<
  T extends Record<string, any>,
  K extends keyof T
>(array: T[], mainKey: K): RecordFromUnion<T, K> {
  const record = Object.create(null) as Partial<RecordFromUnion<T, K>>;

  for (const value of array) {
    const key = value[mainKey];

    // istanbul ignore next
    if (record[key]) {
      throw new Error(`Duplicate ${mainKey} ${JSON.stringify(key)}`);
    }

    // @ts-ignore
    record[key] = value;
  }

  return record as RecordFromUnion<T, K>;
}

export function mapFromArray<T extends Record<string, any>, K extends keyof T>(
  array: T[],
  mainKey: K,
): Map<T[K], T> {
  const map = new Map<T[K], T>();

  for (const value of array) {
    const key = value[mainKey];

    // istanbul ignore next
    if (map.has(key)) {
      throw new Error(`Duplicate ${mainKey} ${JSON.stringify(key)}`);
    }

    map.set(key, value);
  }

  return map;
}

export function createAutoChecklist() {
  const map: { [idString: string]: boolean } = Object.create(null);
  return (id: any) => {
    const idString = JSON.stringify(id);
    if (map[idString]) {
      return true;
    }
    map[idString] = true;
    return false;
  };
}

export function partition<T>(
  array: T[],
  predicate: (x: T) => boolean,
): [T[], T[]] {
  const trueArray: T[] = [];
  const falseArray: T[] = [];

  for (const value of array) {
    if (predicate(value)) {
      trueArray.push(value);
    } else {
      falseArray.push(value);
    }
  }

  return [trueArray, falseArray];
}

export function isInt(value: number) {
  return value === Math.floor(value);
}

export function comparePrimitive(
  a: undefined | null | boolean | number | string,
  b: undefined | null | boolean | number | string,
): number {
  if (a === b) {
    return 0;
  }

  const typeofA = typeof a;
  const typeofB = typeof b;

  const orders = [
    'undefined',
    'object', // null
    'boolean',
    'number',
    'string',
  ];
  if (typeofA !== typeofB) {
    return orders.indexOf(typeofA) - orders.indexOf(typeofB);
  }

  if (typeofA !== 'string') {
    return Number(a) - Number(b);
  }

  return (a as string).localeCompare(b as string);
}

export function normalizeInvalidHandler(
  invalidHandler: InvalidHandler,
): NormalizedInvalidHandler {
  return (...args) => {
    const errorMessageOrError = invalidHandler(...args);
    return typeof errorMessageOrError === 'string'
      ? new Error(errorMessageOrError)
      : /* istanbul ignore next*/ errorMessageOrError;
  };
}

export function normalizeDefaultResult<$Value>(
  result: DefaultResult<$Value>,
): NormalizedDefaultResult<$Value> {
  return result === undefined ? {} : result;
}

export function normalizeExpectedResult(
  result: ExpectedResult,
): NormalizedExpectedResult {
  if (typeof result === 'string') {
    return { valueDescriptions: [], description: result };
  }

  if (!('valueTitle' in result)) {
    return { valueDescriptions: [], description: result.description };
  }

  const { description, valueTitle, valueDescriptions } = result;

  return {
    description,
    valueTitle,
    valueDescriptions: valueDescriptions.map(normalizeExpectedResult),
  };
}

export function normalizeValidateResult(
  result: ValidateResult,
  value: unknown,
): NormalizedValidateResult {
  return result === true ? true : result === false ? { value } : result;
}

export function normalizeDeprecatedResult<$Value>(
  result: DeprecatedResult<$Value>,
  value: $Value,
): NormalizedDeprecatedResult<$Value>;
export function normalizeDeprecatedResult<$Value>(
  result: DeprecatedResult<$Value>,
  value: $Value,
  doNotNormalizeTrue: true,
): NormalizedDeprecatedResultWithTrue<$Value>;
export function normalizeDeprecatedResult<$Value>(
  result: DeprecatedResult<$Value>,
  value: $Value,
  doNotNormalizeTrue = false,
):
  | NormalizedDeprecatedResult<$Value>
  | NormalizedDeprecatedResultWithTrue<$Value> {
  return result === false
    ? false
    : result === true
      ? doNotNormalizeTrue
        ? true
        : [{ value }]
      : 'value' in result
        ? [result]
        : result.length === 0
          ? false
          : (result as NotEmptyArray<{ value: $Value }>);
}

export function normalizeTransferResult<$Value>(
  result: TransferResult<$Value>,
  value: $Value,
): NormalizedTransferResult<$Value> {
  return typeof result === 'string' || 'key' in result
    ? { from: value, to: result }
    : 'from' in result
      ? { from: result.from!, to: result.to }
      : { from: value, to: result.to };
}

export function normalizeForwardResult<$Value>(
  result: ForwardResult<$Value>,
  value: $Value,
): NormalizedForwardResult<$Value> {
  return result === undefined
    ? []
    : Array.isArray(result)
      ? result.map(transferResult =>
          normalizeTransferResult(transferResult, value),
        )
      : [normalizeTransferResult(result, value)];
}

export function normalizeRedirectResult<$Value>(
  result: RedirectResult<$Value>,
  value: $Value,
): NormalizedRedirectResult<$Value> {
  const redirect = normalizeForwardResult(
    typeof result === 'object' && 'redirect' in result
      ? result.redirect
      : result,
    value,
  );
  return redirect.length === 0
    ? { remain: value, redirect }
    : typeof result === 'object' && 'remain' in result
      ? { remain: result.remain, redirect }
      : { redirect };
}
