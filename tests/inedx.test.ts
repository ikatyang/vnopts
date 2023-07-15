import { beforeEach, describe, expect, test } from 'vitest'
import * as vnopts from '../src/index.js'
import { createLogger } from './__helpers__/utils.js'

const logger = createLogger()

beforeEach(() => {
  logger.clearMessages()
})

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
]

test('deprecated', () => {
  expect(
    vnopts.normalize({ useFlowParser: true }, schemas, { logger }),
  ).toMatchSnapshot()
  expect(logger.getMessages()).toMatchSnapshot()
})

test('redirect', () => {
  expect(
    vnopts.normalize({ parser: 'postcss' }, schemas, { logger }),
  ).toMatchSnapshot()
  expect(logger.getMessages()).toMatchSnapshot()
})

describe('missing', () => {
  const name = '<key>'
  const missing: vnopts.IdentifyMissing = (key, options) =>
    options[key] === undefined

  test('missing pair will be filtered', () => {
    expect(
      vnopts.normalize(
        { [name]: undefined },
        [vnopts.createSchema(vnopts.AnySchema, { name, validate: false })],
        { missing },
      ),
    ).toEqual({})
    expect(
      vnopts.normalize(
        { unknown: true },
        [vnopts.createSchema(vnopts.AnySchema, { name })],
        { missing, unknown: () => ({ [name]: undefined }) },
      ),
    ).toEqual({})
  })

  test('missing pair will be replaced by default pair if present', () => {
    const defaultValue = 'foo'
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
    ).toEqual({ [name]: defaultValue })
  })
})

test('required', () => {
  expect(() =>
    vnopts.normalize(
      {},
      [vnopts.createSchema(vnopts.AnySchema, { name: '<key>' })],
      { required: () => true },
    ),
  ).toThrowErrorMatchingSnapshot()
})

describe('postprocess', () => {
  const name = '<key>'
  const validValue1 = '<valid-value-1>'
  const validValue2 = '<valid-value-2>'
  const invalidValue = '<invalid-value>'

  describe('schema', () => {
    test('throw error for invalid postprocessed value', () => {
      expect(() =>
        vnopts.normalize({ [name]: validValue1 }, [
          vnopts.createSchema(vnopts.ChoiceSchema, {
            name,
            choices: [validValue1],
            postprocess: () => invalidValue,
          }),
        ]),
      ).toThrowErrorMatchingSnapshot()
    })
    test('replace with valid postprocessed value', () => {
      expect(
        vnopts.normalize({ [name]: validValue1 }, [
          vnopts.createSchema(vnopts.ChoiceSchema, {
            name,
            choices: [validValue1, validValue2],
            postprocess: () => validValue2,
          }),
        ]),
      ).toEqual({ [name]: validValue2 })
    })
  })

  describe('normalizer', () => {
    test('delete', () => {
      expect(
        vnopts.normalize(
          { [name]: validValue1 },
          [
            vnopts.createSchema(vnopts.ChoiceSchema, {
              name,
              choices: [validValue1],
            }),
          ],
          { postprocess: () => ({ delete: [name] }) },
        ),
      ).toEqual({})
    })
    test('throw invalid override value', () => {
      expect(() =>
        vnopts.normalize(
          {},
          [
            vnopts.createSchema(vnopts.ChoiceSchema, {
              name,
              choices: [validValue1],
            }),
          ],
          { postprocess: () => ({ override: { [name]: invalidValue } }) },
        ),
      ).toThrowErrorMatchingInlineSnapshot(
        `"Invalid \\"<key>\\" value. Expected \\"<valid-value-1>\\", but received \\"<invalid-value>\\"."`,
      )
    })
    test('throw invalid override value from unknownHandler result', () => {
      expect(() =>
        vnopts.normalize(
          {},
          [
            vnopts.createSchema(vnopts.ChoiceSchema, {
              name,
              choices: [validValue1],
            }),
          ],
          {
            postprocess: () => ({ override: { unknown: true } }),
            unknown: () => ({ [name]: invalidValue }),
          },
        ),
      ).toThrowErrorMatchingInlineSnapshot(
        `"Invalid \\"<key>\\" value. Expected \\"<valid-value-1>\\", but received \\"<invalid-value>\\"."`,
      )
    })
    test('apply valid override value from unknownHandler result', () => {
      expect(
        vnopts.normalize(
          {},
          [
            vnopts.createSchema(vnopts.ChoiceSchema, {
              name,
              choices: [validValue1],
            }),
            vnopts.createSchema(vnopts.AnySchema, { name: 'known' }),
          ],
          {
            postprocess: () => ({ override: { known: true, unknown: true } }),
            unknown: () => ({ [name]: validValue1 }),
          },
        ),
      ).toEqual({ known: true, [name]: validValue1 })
      expect(
        vnopts.normalize(
          {},
          [vnopts.createSchema(vnopts.AnySchema, { name: 'known' })],
          { postprocess: () => ({ override: { known: true } }) },
        ),
      ).toEqual({ known: true })
    })
  })
})
