import chalk from 'chalk';
import { VALUE_NOT_EXIST } from '../../constants';
import { InvalidHandler } from '../../types';

export const commonInvalidHandler: InvalidHandler = (key, value, utils) =>
  [
    `Invalid ${chalk.red(utils.descriptor.key(key))} value.`,
    `Expected ${chalk.blue(utils.schemas[key].expected(utils))},`,
    `but received ${
      value === VALUE_NOT_EXIST
        ? chalk.gray('nothing')
        : chalk.red(utils.descriptor.value(value))
    }.`,
  ].join(' ');
