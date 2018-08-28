import { Schema, SchemaHandlers, SchemaParameters } from '../schema';
import {
  DeprecatedResult,
  ForwardResult,
  RedirectResult,
  TransferTo,
  Utils,
  ValidateResult,
} from '../types';
import { comparePrimitive, mapFromArray } from '../utils';

interface ChoiceInfo {
  value: ChoiceValue;
  deprecated?: boolean;
  redirect?: TransferTo;
  forward?: TransferTo;
}

type ChoiceValue = undefined | null | boolean | number | string;

interface ChoiceSchemaParameters
  extends SchemaParameters<ChoiceValue>,
    SchemaHandlers<ChoiceValue> {
  choices: Array<ChoiceValue | ChoiceInfo>;
}

export class ChoiceSchema extends Schema<ChoiceValue, ChoiceSchemaParameters> {
  private _choices: Map<ChoiceValue, ChoiceInfo>;

  constructor(parameters: ChoiceSchemaParameters) {
    super(parameters);
    this._choices = mapFromArray(
      parameters.choices.map(
        choice =>
          choice && typeof choice === 'object' ? choice : { value: choice },
      ),
      'value',
    );
  }

  public expected({ descriptor }: Utils) {
    const choiceValues = Array.from(this._choices.keys())
      .map(value => this._choices.get(value)!)
      .filter(choiceInfo => !choiceInfo.deprecated)
      .map(choiceInfo => choiceInfo.value)
      .sort(comparePrimitive)
      .map(descriptor.value);

    const head = choiceValues.slice(0, -2);
    const tail = choiceValues.slice(-2);
    return head.concat(tail.join(' or ')).join(', ');
  }

  public validate(value: unknown): ValidateResult {
    return this._choices.has(value as any);
  }

  public deprecated(value: ChoiceValue): DeprecatedResult<ChoiceValue> {
    const choiceInfo = this._choices.get(value);
    return choiceInfo && choiceInfo.deprecated ? { value } : false;
  }

  public forward(value: ChoiceValue): ForwardResult<ChoiceValue> {
    const choiceInfo = this._choices.get(value);
    return choiceInfo ? choiceInfo.forward : undefined;
  }

  public redirect(value: ChoiceValue): RedirectResult<ChoiceValue> {
    const choiceInfo = this._choices.get(value);
    return choiceInfo ? choiceInfo.redirect : undefined;
  }
}
