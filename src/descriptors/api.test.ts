import { apiDescriptor } from './api';

test('apiDescriptor', () => {
  expect(apiDescriptor.value({})).toMatchSnapshot();
  expect(apiDescriptor.value('key')).toMatchSnapshot();
  expect(apiDescriptor.value({ key: 'value' })).toMatchSnapshot();
});
