import { eachHandler } from '../../tests/__helpers__/utils';
import { AnySchema } from './any';
import { ChoiceSchema } from './choice';

const name = '<key>';
const value = '<value>';

const transferKey = '<transfer-key>';
const transferValue = '<transfer-value>';
const transferPair = { key: transferKey, value: transferValue };
const transfer = { [transferKey]: transferValue };

const invalidValue = '<invalid-value>';
const deprecatedValue = '<deprecated-value>';
const forwardValue = '<forward-value>';
const redirectValue = '<redirect-value>';
const unknownValue = '<unknown-value>';
const hiddenValue = '<hidden-value>';

describe.each`
  parameters            | input                          | output                                   | hasWarnings
  ${{}}                 | ${{ [name]: value }}           | ${{ [name]: value }}                     | ${false}
  ${{}}                 | ${{ [name]: invalidValue }}    | ${Error}                                 | ${false}
  ${{}}                 | ${{ [name]: deprecatedValue }} | ${{ [name]: deprecatedValue }}           | ${true}
  ${{}}                 | ${{ [name]: forwardValue }}    | ${{ [name]: forwardValue, ...transfer }} | ${false}
  ${{}}                 | ${{ [name]: redirectValue }}   | ${transfer}                              | ${false}
  ${{ validate: true }} | ${{ [name]: unknownValue }}    | ${{ [name]: unknownValue }}              | ${false}
`(
  '',
  eachHandler<ChoiceSchema>(
    ChoiceSchema,
    {
      name,
      choices: [
        value,
        { value: deprecatedValue, deprecated: true },
        { value: forwardValue, forward: transferPair },
        { value: redirectValue, redirect: transferPair },
        { value: hiddenValue, hidden: true },
      ],
    },
    { schemas: [new AnySchema({ name: transferKey })] },
  ),
);

for (const loggerPrintWidth of [-Infinity, Infinity]) {
  describe.each`
    parameters | input                    | output   | hasWarnings
    ${{}}      | ${{ [name]: 'invalid' }} | ${Error} | ${false}
  `(
    `(expected values printWidth=${loggerPrintWidth})`,
    eachHandler<ChoiceSchema>(
      ChoiceSchema,
      {
        name,
        choices: Array.from(new Array(5), (_value, index) => `value${index}`),
      },
      { loggerPrintWidth },
    ),
  );
}
