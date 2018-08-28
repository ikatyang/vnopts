import {
  defaultDeprecatedHandler,
  defaultDescriptor,
  defaultInvalidHandler,
  defaultUnknownHandler,
} from './defaults';
import { Schema } from './schema';
import {
  DeprecatedHandler,
  Descriptor,
  InvalidHandler,
  Logger,
  NormalizedTransferResult,
  OptionPair,
  Options,
  TransferTo,
  UnknownHandler,
  Utils,
} from './types';
import {
  createAutoChecklist,
  normalizeDefaultResult,
  normalizeDeprecatedResult,
  normalizeForwardResult,
  normalizeRedirectResult,
  normalizeValidateResult,
  partition,
  recordFromArray,
} from './utils';

export interface NormalizerOptions {
  logger?: false | Logger;
  descriptor?: Descriptor;
  unknown?: UnknownHandler;
  invalid?: InvalidHandler;
  deprecated?: DeprecatedHandler;
}

export const normalize = (
  options: Options,
  schemas: Array<Schema<any>>,
  opts?: NormalizerOptions,
) => new Normalizer(schemas, opts).normalize(options);

export class Normalizer {
  private _utils: Utils;
  private _unknownHandler: UnknownHandler;
  private _invalidHandler: InvalidHandler;
  private _deprecatedHandler: DeprecatedHandler;
  private _hasDeprecationWarned!: ReturnType<typeof createAutoChecklist>;

  constructor(schemas: Array<Schema<any>>, opts?: NormalizerOptions) {
    // istanbul ignore next
    const {
      logger = console,
      descriptor = defaultDescriptor,
      unknown = defaultUnknownHandler,
      invalid = defaultInvalidHandler,
      deprecated = defaultDeprecatedHandler,
    } = opts || {};

    this._utils = {
      descriptor,
      logger: /* istanbul ignore next */ logger || { warn: () => {} },
      schemas: recordFromArray(schemas, 'name'),
      normalizeDefaultResult,
      normalizeDeprecatedResult,
      normalizeForwardResult,
      normalizeRedirectResult,
      normalizeValidateResult,
    };

    this._unknownHandler = unknown;
    this._invalidHandler = invalid;
    this._deprecatedHandler = deprecated;

    this.cleanHistory();
  }

  public cleanHistory() {
    this._hasDeprecationWarned = createAutoChecklist();
  }

  public normalize(options: Options): Options {
    const normalized: Options = {};
    const restOptionsArray = [options];

    const applyNormalization = () => {
      while (restOptionsArray.length !== 0) {
        const currentOptions = restOptionsArray.shift()!;
        const transferredOptionsArray = this._applyNormalization(
          currentOptions,
          normalized,
        );
        restOptionsArray.push(...transferredOptionsArray);
      }
    };

    applyNormalization();

    for (const key of Object.keys(this._utils.schemas)) {
      const schema = this._utils.schemas[key];
      if (!(key in normalized)) {
        const defaultResult = normalizeDefaultResult(
          schema.default(this._utils),
        );
        if ('value' in defaultResult) {
          restOptionsArray.push({ [key]: defaultResult.value! });
        }
      }
    }

    applyNormalization();

    for (const key of Object.keys(this._utils.schemas)) {
      const schema = this._utils.schemas[key];
      if (key in normalized) {
        normalized[key] = schema.postprocess(normalized[key], this._utils);
      }
    }

    return normalized;
  }

  private _applyNormalization(
    options: Options,
    normalized: Options,
  ): Options[] {
    const transferredOptionsArray: Options[] = [];

    const [knownOptionNames, unknownOptionNames] = partition(
      Object.keys(options),
      key => key in this._utils.schemas,
    );

    for (const key of knownOptionNames) {
      const schema = this._utils.schemas[key];
      const value = schema.preprocess(options[key], this._utils);

      const validateResult = normalizeValidateResult(
        schema.validate(value, this._utils),
        value,
      );
      if (validateResult !== true) {
        const { value: invalidValue } = validateResult;
        const errorMessageOrError = this._invalidHandler(
          key,
          invalidValue,
          this._utils,
        );

        throw typeof errorMessageOrError === 'string'
          ? new Error(errorMessageOrError)
          : /* istanbul ignore next*/ errorMessageOrError;
      }

      const appendTransferredOptions = <$Value>(
        { from, to }: NormalizedTransferResult<$Value>, //
      ) => {
        transferredOptionsArray.push(
          typeof to === 'string' ? { [to]: from } : { [to.key]: to.value },
        );
      };

      const warnDeprecated = <$Value>({
        value: currentValue,
        redirectTo,
      }: {
        value: $Value;
        redirectTo?: TransferTo;
      }) => {
        const deprecatedResult = normalizeDeprecatedResult(
          schema.deprecated(currentValue, this._utils),
          value,
          /* doNotNormalizeTrue */ true,
        );

        if (deprecatedResult === false) {
          return;
        }

        if (deprecatedResult === true) {
          if (!this._hasDeprecationWarned(key)) {
            this._utils.logger.warn(
              this._deprecatedHandler(key, redirectTo, this._utils),
            );
          }
        } else {
          for (const { value: deprecatedValue } of deprecatedResult) {
            const pair: OptionPair = { key, value: deprecatedValue };
            if (!this._hasDeprecationWarned(pair)) {
              const redirectToPair =
                typeof redirectTo === 'string'
                  ? { key: redirectTo, value: deprecatedValue }
                  : redirectTo;
              this._utils.logger.warn(
                this._deprecatedHandler(pair, redirectToPair, this._utils),
              );
            }
          }
        }
      };

      const forwardResult = normalizeForwardResult(
        schema.forward(value, this._utils),
        value,
      );

      forwardResult.forEach(appendTransferredOptions);

      const redirectResult = normalizeRedirectResult(
        schema.redirect(value, this._utils),
        value,
      );

      redirectResult.redirect.forEach(appendTransferredOptions);

      if ('remain' in redirectResult) {
        const remainingValue = redirectResult.remain!;

        normalized[key] =
          key in normalized
            ? schema.overlap(normalized[key], remainingValue, this._utils)
            : remainingValue;

        warnDeprecated({ value: remainingValue });
      }

      for (const { from, to } of redirectResult.redirect) {
        warnDeprecated({ value: from, redirectTo: to });
      }
    }

    for (const key of unknownOptionNames) {
      const value = options[key];

      const unknownResult = this._unknownHandler(key, value, this._utils);
      if (unknownResult) {
        for (const unknownKey of Object.keys(unknownResult)) {
          const unknownOption = { [unknownKey]: unknownResult[unknownKey] };
          if (unknownKey in this._utils.schemas) {
            transferredOptionsArray.push(unknownOption);
          } else {
            Object.assign(normalized, unknownOption);
          }
        }
      }
    }

    return transferredOptionsArray;
  }
}
