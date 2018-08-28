import { eachHandler } from '../../tests/__helpers__/utils';
import { IntegerSchema } from './integer';

const name = '<key>';
const value = 1;

describe.each`
  parameters | input                | output               | hasWarnings
  ${{}}      | ${{ [name]: value }} | ${{ [name]: value }} | ${false}
  ${{}}      | ${{ [name]: 1.5 }}   | ${Error}             | ${false}
`('', eachHandler<IntegerSchema>(IntegerSchema, { name }));
