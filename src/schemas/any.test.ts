import { eachHandler } from '../../tests/__helpers__/utils';
import { AnySchema } from './any';

const name = '<key>';
const value = '<value>';

describe.each`
  parameters             | input                | output               | hasWarnings
  ${{}}                  | ${{ [name]: value }} | ${{ [name]: value }} | ${false}
  ${{ validate: false }} | ${{ [name]: value }} | ${Error}             | ${false}
`('', eachHandler<AnySchema>(AnySchema, { name }));
