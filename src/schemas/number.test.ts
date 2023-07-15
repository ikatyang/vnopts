import { describe } from 'vitest'
import { eachHandler } from '../../tests/__helpers__/utils.js'
import { NumberSchema } from './number.js'

const name = '<key>'
const value = 1

describe.each`
  parameters | input                   | output               | hasWarnings
  ${{}}      | ${{ [name]: value }}    | ${{ [name]: value }} | ${false}
  ${{}}      | ${{ [name]: 'string' }} | ${Error}             | ${false}
`('', eachHandler<NumberSchema>(NumberSchema, { name }))
