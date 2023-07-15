import { describe } from 'vitest'
import { eachHandler } from '../../tests/__helpers__/utils.js'
import { StringSchema } from './string.js'

const name = '<key>'
const value = 'string'

describe.each`
  parameters | input                | output               | hasWarnings
  ${{}}      | ${{ [name]: value }} | ${{ [name]: value }} | ${false}
  ${{}}      | ${{ [name]: 1 }}     | ${Error}             | ${false}
`('', eachHandler<StringSchema>(StringSchema, { name }))
