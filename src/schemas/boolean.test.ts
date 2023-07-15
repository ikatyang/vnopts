import { describe } from 'vitest'
import { eachHandler } from '../../tests/__helpers__/utils.js'
import { BooleanSchema } from './boolean.js'

const name = '<key>'
const value = true

describe.each`
  parameters | input                    | output               | hasWarnings
  ${{}}      | ${{ [name]: value }}     | ${{ [name]: value }} | ${false}
  ${{}}      | ${{ [name]: 'invalid' }} | ${Error}             | ${false}
`('', eachHandler<BooleanSchema>(BooleanSchema, { name }))
