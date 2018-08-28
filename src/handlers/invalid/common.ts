import chalk from 'chalk';
import { InvalidHandler } from '../../types';

export const commonInvalidHandler: InvalidHandler = (key, value, utils) =>
  [
    `Invalid ${chalk.red(utils.descriptor.key(key))} value.`,
    `Expected ${chalk.blue(utils.schemas[key].expected(utils))},`,
    `but received ${chalk.red(utils.descriptor.value(value))}.`,
  ].join(' ');
