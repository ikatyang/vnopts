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
      ],
    },
    { schemas: [new AnySchema({ name: transferKey })] },
  ),
);
