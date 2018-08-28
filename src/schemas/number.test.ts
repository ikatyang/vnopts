import { eachHandler } from '../../tests/__helpers__/utils';
import { NumberSchema } from './number';

const name = '<key>';
const value = 1;

describe.each`
  parameters | input                   | output               | hasWarnings
  ${{}}      | ${{ [name]: value }}    | ${{ [name]: value }} | ${false}
  ${{}}      | ${{ [name]: 'string' }} | ${Error}             | ${false}
`('', eachHandler<NumberSchema>(NumberSchema, { name }));
