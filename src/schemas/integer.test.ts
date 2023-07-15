import { describe } from 'vitest'
import { eachHandler } from '../../tests/__helpers__/utils.js'
import { IntegerSchema } from './integer.js'

const name = '<key>'
const value = 1

describe.each`
  parameters | input                | output               | hasWarnings
  ${{}}      | ${{ [name]: value }} | ${{ [name]: value }} | ${false}
  ${{}}      | ${{ [name]: 1.5 }}   | ${Error}             | ${false}
`('', eachHandler<IntegerSchema>(IntegerSchema, { name }))
