import { describe } from 'vitest'
import { eachHandler } from '../../tests/__helpers__/utils.js'
import { AliasSchema } from './alias.js'
import { ChoiceSchema } from './choice.js'

const name = '<key>'
const validValue = '<valid-value>'
const invalidValue = '<invalid-value>'

const sourceName = '<source-key>'

describe.each`
  parameters | input                       | output                          | hasWarnings
  ${{}}      | ${{ [name]: invalidValue }} | ${Error}                        | ${false}
  ${{}}      | ${{ [name]: validValue }}   | ${{ [sourceName]: validValue }} | ${false}
`(
  '',
  eachHandler<AliasSchema>(
    AliasSchema,
    { name, sourceName },
    {
      schemas: [
        ChoiceSchema.create<ChoiceSchema>({
          name: sourceName,
          choices: [validValue],
        }),
      ],
    },
  ),
)
