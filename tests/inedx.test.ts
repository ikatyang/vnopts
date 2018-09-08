import * as vnopts from '../src';
import { IdentifyMissing } from '../src';
import { createLogger } from './__helpers__/utils';

const logger = createLogger();

beforeEach(() => {
  logger.clearMessages();
});

const schemas = [
  vnopts.createSchema(vnopts.BooleanSchema, {
    name: 'useFlowParser',
    deprecated: true,
    redirect: (value: boolean) =>
      !value ? undefined : { to: { key: 'parser', value: 'flow' } },
  }),
  vnopts.createSchema(vnopts.ChoiceSchema, {
    name: 'parser',
    validate: (value: unknown) =>
      ['function', 'string'].indexOf(typeof value) !== -1,
    choices: [
      'flow',
      'babylon',
      'typescript',
      {
        value: 'postcss',
        deprecated: true,
        redirect: { key: 'parser', value: 'css' },
      },
      'css',
      'less',
      'scss',
    ],
  }),
];

test('deprecated', () => {
  expect(
    vnopts.normalize({ useFlowParser: true }, schemas, { logger }),
  ).toMatchSnapshot();
  expect(logger.getMessages()).toMatchSnapshot();
});

test('redirect', () => {
  expect(
    vnopts.normalize({ parser: 'postcss' }, schemas, { logger }),
  ).toMatchSnapshot();
  expect(logger.getMessages()).toMatchSnapshot();
});

describe('missing', () => {
  const name = 'a';
  const missing: IdentifyMissing = (key, options) => options[key] === undefined;

  test('missing pair will be filtered', () => {
    expect(
      vnopts.normalize(
        { [name]: undefined },
        [vnopts.createSchema(vnopts.AnySchema, { name, validate: false })],
        { missing },
      ),
    ).toEqual({});
  });

  test('missing pair will be replaced by default pair if present', () => {
    const defaultValue = 'foo';
    expect(
      vnopts.normalize(
        { [name]: undefined },
        [
          vnopts.createSchema(vnopts.AnySchema, {
            name,
            default: { value: defaultValue },
          }),
        ],
        { missing },
      ),
    ).toEqual({ a: defaultValue });
  });
});

test('required', () => {
  expect(() =>
    vnopts.normalize(
      {},
      [vnopts.createSchema(vnopts.AnySchema, { name: '<key>' })],
      { required: () => true },
    ),
  ).toThrowErrorMatchingSnapshot();
});
