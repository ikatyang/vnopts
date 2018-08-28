import { eachHandler } from '../../tests/__helpers__/utils';
import { StringSchema } from './string';

const name = '<key>';
const value = 'string';

describe.each`
  parameters | input                | output               | hasWarnings
  ${{}}      | ${{ [name]: value }} | ${{ [name]: value }} | ${false}
  ${{}}      | ${{ [name]: 1 }}     | ${Error}             | ${false}
`('', eachHandler<StringSchema>(StringSchema, { name }));
