import { describe, expect, test } from 'vitest'
import {
  createSchema,
  Normalizer,
  OptionKey,
  OptionValue,
  Schema,
  SchemaParameters,
} from '../src/index.js'
import { createLogger, eachHandler } from './__helpers__/utils.js'

class TestSchema extends Schema<any, SchemaParameters<any>> {
  public expected() {
    return '<expected>'
  }
  public validate() {
    return true
  }
}

const name = '<key>'
const value = '<value>'
const option = { [name]: value }
const transferKey = '<transfer-key>'
const transferValue = '<transfer-value>'
const transferPair = { key: transferKey, value: transferValue }
const transfer = { [transferKey]: transferValue }
const unknownKey = '<unknown-key>'
const unknownValue = '<unknown-value>'
const unknown = { [unknownKey]: unknownValue }
const veryUnknown = { veryUnknown: '<very-unknown-value>' }
const overlapKey = '<overlap-key>'
const overlapValue = '<overlap-value>'
const overlap = { [overlapKey]: overlapValue }
const invalidValue = '<invalid-value>'
const knownKey = '<known-key>'

const passThrough = (k: OptionKey, v: OptionValue) => ({ [k]: v })
const redirectTo = (k: OptionKey) => (_k: OptionKey, v: OptionValue) => ({
  [k]: v,
})

describe.each`
  parameters                                           | input                        | output                                 | hasWarnings
  ${{ default: { value } }}                            | ${{}}                        | ${option}                              | ${false}
  ${{ validate: false }}                               | ${option}                    | ${Error}                               | ${false}
  ${{ validate: { value: invalidValue } }}             | ${option}                    | ${Error}                               | ${false}
  ${{ deprecated: true }}                              | ${option}                    | ${option}                              | ${true}
  ${{ deprecated: { value } }}                         | ${option}                    | ${option}                              | ${true}
  ${{ deprecated: true, redirect: transferKey }}       | ${option}                    | ${{ [transferKey]: value }}            | ${true}
  ${{ deprecated: { value }, redirect: transferKey }}  | ${option}                    | ${{ [transferKey]: value }}            | ${true}
  ${{ deprecated: true, redirect: transferPair }}      | ${option}                    | ${{ ...transfer }}                     | ${true}
  ${{ deprecated: { value }, redirect: transferPair }} | ${option}                    | ${{ ...transfer }}                     | ${true}
  ${{ forward: transferKey }}                          | ${option}                    | ${{ ...option, [transferKey]: value }} | ${false}
  ${{ forward: transferPair }}                         | ${option}                    | ${{ ...option, ...transfer }}          | ${false}
  ${{ redirect: transferKey }}                         | ${option}                    | ${{ [transferKey]: value }}            | ${false}
  ${{ redirect: transferPair }}                        | ${option}                    | ${{ ...transfer }}                     | ${false}
  ${{}}                                                | ${unknown}                   | ${{}}                                  | ${true}
  ${{}}                                                | ${veryUnknown}               | ${{}}                                  | ${true}
  ${{ unknown: passThrough }}                          | ${unknown}                   | ${unknown}                             | ${false}
  ${{ unknown: redirectTo(knownKey) }}                 | ${unknown}                   | ${{ [knownKey]: unknownValue }}        | ${false}
  ${{ redirect: overlapKey }}                          | ${{ ...option, ...overlap }} | ${{ ...overlap }}                      | ${false}
`(
  '',
  eachHandler<TestSchema>(
    TestSchema,
    { name },
    {
      schemas: [
        createSchema(TestSchema, { name: knownKey }),
        createSchema(TestSchema, { name: overlapKey }),
        createSchema(TestSchema, { name: transferKey }),
      ],
    },
  ),
)

test('no duplicate deprecation warnings', () => {
  for (const deprecatedResult of [true, { value }]) {
    const logger = createLogger()

    const schemas = [
      TestSchema.create<TestSchema>({ name, deprecated: deprecatedResult }),
    ]
    const normalizer = new Normalizer(schemas, { logger })

    let lastMessagesLength = -1
    for (let i = 0; i < 2; i++) {
      normalizer.normalize({ [name]: value })
      const messagesLength = logger.getMessages().length

      if (i > 0) {
        expect(messagesLength).toEqual(lastMessagesLength)
        expect(messagesLength).toBeGreaterThan(0)
      }

      lastMessagesLength = messagesLength
    }
  }
})
