import { VALUE_NOT_EXIST, VALUE_UNCHANGED } from './constants';
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
  IdentifyMissing,
  IdentifyRequired,
  InvalidHandler,
  Logger,
  NormalizedInvalidHandler,
  NormalizedTransferResult,
  OptionKey,
  OptionPair,
  Options,
  OptionValue,
  Postprocess,
  Preprocess,
  TransferTo,
  UnknownHandler,
  Utils,
} from './types';
import {
  createAutoChecklist,
  normalizeDefaultResult,
  normalizeDeprecatedResult,
  normalizeExpectedResult,
  normalizeForwardResult,
  normalizeInvalidHandler,
  normalizeRedirectResult,
  normalizeValidateResult,
  partition,
  recordFromArray,
} from './utils';

export interface NormalizerOptions {
  logger?: false | Logger;
  loggerPrintWidth?: number;
  descriptor?: Descriptor;
  unknown?: UnknownHandler;
  invalid?: InvalidHandler;
  deprecated?: DeprecatedHandler;
  missing?: IdentifyMissing;
  required?: IdentifyRequired;
  preprocess?: Preprocess;
  postprocess?: Postprocess;
}

export const normalize = (
  options: Options,
  schemas: Array<Schema<any>>,
  opts?: NormalizerOptions,
) => new Normalizer(schemas, opts).normalize(options);

export class Normalizer {
  private _utils: Utils;
  private _unknownHandler: UnknownHandler;
  private _invalidHandler: NormalizedInvalidHandler;
  private _deprecatedHandler: DeprecatedHandler;
  private _hasDeprecationWarned!: ReturnType<typeof createAutoChecklist>;
  private _identifyMissing: IdentifyMissing;
  private _identifyRequired: IdentifyRequired;
  private _preprocess: Preprocess;
  private _postprocess: Postprocess;

  constructor(schemas: Array<Schema<any>>, opts?: NormalizerOptions) {
    // istanbul ignore next
    const {
      logger = console,
      loggerPrintWidth = 80,
      descriptor = defaultDescriptor,
      unknown = defaultUnknownHandler,
      invalid = defaultInvalidHandler,
      deprecated = defaultDeprecatedHandler,
      missing = () => false,
      required = () => false,
      preprocess = (x: Options) => x,
      postprocess = (): typeof VALUE_UNCHANGED => VALUE_UNCHANGED,
    } = opts || {};

    this._utils = {
      descriptor,
      logger: /* istanbul ignore next */ logger || { warn: () => {} },
      loggerPrintWidth,
      schemas: recordFromArray(schemas, 'name'),
      normalizeDefaultResult,
      normalizeExpectedResult,
      normalizeDeprecatedResult,
      normalizeForwardResult,
      normalizeRedirectResult,
      normalizeValidateResult,
    };

    this._unknownHandler = unknown;
    this._invalidHandler = normalizeInvalidHandler(invalid);
    this._deprecatedHandler = deprecated;
    this._identifyMissing = (k, o) => !(k in o) || missing(k, o);
    this._identifyRequired = required;
    this._preprocess = preprocess;
    this._postprocess = postprocess;

    this.cleanHistory();
  }

  public cleanHistory() {
    this._hasDeprecationWarned = createAutoChecklist();
  }

  public normalize(options: Options): Options {
    const newOptions: Options = {};

    const preprocessed = this._preprocess(options, this._utils);
    const restOptionsArray = [preprocessed];

    const applyNormalization = () => {
      while (restOptionsArray.length !== 0) {
        const currentOptions = restOptionsArray.shift()!;
        const transferredOptionsArray = this._applyNormalization(
          currentOptions,
          newOptions,
        );
        restOptionsArray.push(...transferredOptionsArray);
      }
    };

    applyNormalization();

    for (const key of Object.keys(this._utils.schemas)) {
      const schema = this._utils.schemas[key];
      if (!(key in newOptions)) {
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
      if (!(key in newOptions)) {
        continue;
      }

      const schema = this._utils.schemas[key];

      const value = newOptions[key];
      const newValue = schema.postprocess(value, this._utils);

      if (newValue === VALUE_UNCHANGED) {
        continue;
      }

      this._applyValidation(newValue, key, schema);

      newOptions[key] = newValue;
    }

    this._applyPostprocess(newOptions);
    this._applyRequiredCheck(newOptions);

    return newOptions;
  }

  private _applyNormalization(
    options: Options,
    newOptions: Options,
  ): Options[] {
    const transferredOptionsArray: Options[] = [];

    const { knownKeys, unknownKeys } = this._partitionOptionKeys(options);

    for (const key of knownKeys) {
      const schema = this._utils.schemas[key];
      const value = schema.preprocess(options[key], this._utils);

      this._applyValidation(value, key, schema);

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

        newOptions[key] =
          key in newOptions
            ? schema.overlap(newOptions[key], remainingValue, this._utils)
            : remainingValue;

        warnDeprecated({ value: remainingValue });
      }

      for (const { from, to } of redirectResult.redirect) {
        warnDeprecated({ value: from, redirectTo: to });
      }
    }

    for (const key of unknownKeys) {
      const value = options[key];
      this._applyUnknownHandler(
        key,
        value,
        newOptions,
        (knownResultKey, knownResultValue) => {
          transferredOptionsArray.push({ [knownResultKey]: knownResultValue });
        },
      );
    }

    return transferredOptionsArray;
  }

  private _applyRequiredCheck(options: Options) {
    for (const key of Object.keys(this._utils.schemas)) {
      if (this._identifyMissing(key, options)) {
        if (this._identifyRequired(key)) {
          throw this._invalidHandler(key, VALUE_NOT_EXIST, this._utils);
        }
      }
    }
  }

  private _partitionOptionKeys(options: Options) {
    const [knownKeys, unknownKeys] = partition(
      Object.keys(options).filter(key => !this._identifyMissing(key, options)),
      key => key in this._utils.schemas,
    );
    return { knownKeys, unknownKeys };
  }

  private _applyValidation(value: unknown, key: string, schema: Schema<any>) {
    const validateResult = normalizeValidateResult(
      schema.validate(value, this._utils),
      value,
    );
    if (validateResult !== true) {
      throw this._invalidHandler(key, validateResult.value, this._utils);
    }
  }

  private _applyUnknownHandler(
    key: OptionKey,
    value: OptionValue,
    newOptions: Options,
    knownResultHandler: (key: OptionKey, value: OptionValue) => void,
  ) {
    const unknownResult = this._unknownHandler(key, value, this._utils);

    if (!unknownResult) {
      return;
    }

    for (const resultKey of Object.keys(unknownResult)) {
      if (this._identifyMissing(resultKey, unknownResult)) {
        continue;
      }

      const resultValue = unknownResult[resultKey];
      if (resultKey in this._utils.schemas) {
        knownResultHandler(resultKey, resultValue);
      } else {
        newOptions[resultKey] = resultValue;
      }
    }
  }

  private _applyPostprocess(options: Options): void {
    const postprocessed = this._postprocess(options, this._utils);

    if (postprocessed === VALUE_UNCHANGED) {
      return;
    }

    if (postprocessed.delete) {
      for (const deleteKey of postprocessed.delete) {
        delete options[deleteKey];
      }
    }

    if (postprocessed.override) {
      const { knownKeys, unknownKeys } = this._partitionOptionKeys(
        postprocessed.override,
      );

      for (const key of knownKeys) {
        const value = postprocessed.override[key];
        this._applyValidation(value, key, this._utils.schemas[key]);
        options[key] = value;
      }

      for (const key of unknownKeys) {
        const value = postprocessed.override[key];
        this._applyUnknownHandler(
          key,
          value,
          options,
          (knownResultKey, knownResultValue) => {
            const schema = this._utils.schemas[knownResultKey];
            this._applyValidation(knownResultValue, knownResultKey, schema);
            options[knownResultKey] = knownResultValue;
          },
        );
      }
    }
  }
}
