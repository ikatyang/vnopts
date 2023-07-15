import { expect, test } from 'vitest'
import { apiDescriptor } from './api.js'

test('apiDescriptor', () => {
  expect(apiDescriptor.value({})).toMatchSnapshot()
  expect(apiDescriptor.value('key')).toMatchSnapshot()
  expect(apiDescriptor.value({ key: 'value' })).toMatchSnapshot()
})
