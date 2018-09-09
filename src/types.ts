import { Schema } from './schema';
import {
  normalizeDefaultResult,
  normalizeDeprecatedResult,
  normalizeExpectedResult,
  normalizeForwardResult,
  normalizeRedirectResult,
  normalizeValidateResult,
  NotEmptyArray,
} from './utils';

export interface Utils {
  logger: Logger;
  loggerPrintWidth: number;
  descriptor: Descriptor;
  schemas: Record<string, Schema<any>>;
  normalizeDefaultResult: typeof normalizeDefaultResult;
  normalizeExpectedResult: typeof normalizeExpectedResult;
  normalizeDeprecatedResult: typeof normalizeDeprecatedResult;
  normalizeForwardResult: typeof normalizeForwardResult;
  normalizeRedirectResult: typeof normalizeRedirectResult;
  normalizeValidateResult: typeof normalizeValidateResult;
}

export interface Logger {
  warn(message: string): void;
}

export interface Descriptor {
  key: (key: OptionKey) => string;
  value: (value: OptionValue) => string;
  pair: (pair: OptionPair) => string;
}

export type UnknownHandler = (
  key: OptionKey,
  value: OptionValue,
  utils: Utils,
) => void | Options;

export type InvalidHandler = (
  key: OptionKey,
  value: OptionValue,
  utils: Utils,
) => string | Error;
export type NormalizedInvalidHandler = (
  key: OptionKey,
  value: OptionValue,
  utils: Utils,
) => Error;

export type DeprecatedHandler = (
  keyOrPair: OptionKey | OptionPair,
  redirectTo: undefined | TransferTo,
  utils: Utils,
) => string;

export type IdentifyMissing = (key: string, options: Options) => boolean;
export type IdentifyRequired = (key: string) => boolean;

export type OptionKey = string;
export type OptionValue = any;
export interface OptionPair {
  key: OptionKey;
  value: OptionValue;
}
export interface Options {
  [key: string]: OptionValue;
}

export type TransferTo = OptionKey | OptionPair;
export type TransferResult<$Value> =
  | TransferTo
  | {
      from?: $Value;
      to: TransferTo;
    };
export interface NormalizedTransferResult<$Value> {
  from: $Value;
  to: TransferTo;
}

export type ForwardResult<$Value> =
  | undefined
  | TransferResult<$Value>
  | Array<TransferResult<$Value>>;
export type NormalizedForwardResult<$Value> = Array<
  NormalizedTransferResult<$Value>
>;

export type RedirectResult<$Value> =
  | ForwardResult<$Value>
  | {
      remain?: $Value;
      redirect: ForwardResult<$Value>;
    };
export interface NormalizedRedirectResult<$Value> {
  remain?: $Value;
  redirect: NormalizedForwardResult<$Value>;
}

export type ValidateResult = boolean | { value: unknown };
export type NormalizedValidateResult = true | { value: unknown };

export type DeprecatedResult<$Value> =
  | boolean
  | { value: $Value }
  | Array<{ value: $Value }>;
export type NormalizedDeprecatedResult<$Value> =
  | false
  | NotEmptyArray<{ value: $Value }>;
export type NormalizedDeprecatedResultWithTrue<$Value> =
  | true
  | NormalizedDeprecatedResult<$Value>;

export type ExpectedResult =
  | string
  | {
      // at least one of the following field exists
      text?: string;
      list?: {
        title: string;
        values: ExpectedResult[];
      };
    };
export interface NormalizedExpectedResult {
  text?: string;
  list?: {
    title: string;
    values: NormalizedExpectedResult[];
  };
}

export type DefaultResult<$Value> = undefined | { value?: $Value };
export interface NormalizedDefaultResult<$Value> {
  value?: $Value;
}
