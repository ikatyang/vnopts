import { comparePrimitive, normalizeDeprecatedResult } from './utils';

test(comparePrimitive.name, () => {
  expect([1, 1, true, false, 2, 'string'].sort(comparePrimitive)) //
    .toEqual([false, true, 1, 1, 2, 'string']);
});

test(normalizeDeprecatedResult.name, () => {
  const value = 'hello';
  expect(normalizeDeprecatedResult(true, value)).toEqual([{ value }]);
});
