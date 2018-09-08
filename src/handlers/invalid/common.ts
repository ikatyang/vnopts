import chalk from 'chalk';
import { VALUE_NOT_EXIST } from '../../constants';
import { InvalidHandler, NormalizedExpectedResult } from '../../types';

const INDENTATION = ' '.repeat(2);

export const commonInvalidHandler: InvalidHandler = (key, value, utils) => {
  const {
    description,
    valueTitle,
    valueDescriptions,
  } = utils.normalizeExpectedResult(utils.schemas[key].expected(utils));

  const possibleDescriptions: string[] = [];

  if (description) {
    possibleDescriptions.push(
      [
        `Invalid ${chalk.red(utils.descriptor.key(key))} value.`,
        `Expected ${chalk.blue(description)},`,
        `but received ${
          value === VALUE_NOT_EXIST
            ? chalk.gray('nothing')
            : chalk.red(utils.descriptor.value(value))
        }.`,
      ].join(' '),
    );
  }

  if (valueTitle) {
    possibleDescriptions.push(
      [
        [
          `Invalid ${chalk.red(utils.descriptor.key(key))} value.`,
          `Expected ${chalk.blue(valueTitle)},`,
          `but received ${
            value === VALUE_NOT_EXIST
              ? chalk.gray('nothing')
              : chalk.red(utils.descriptor.value(value))
          }.`,
        ].join(' '),
        valueDescriptions
          .map(valueDescription =>
            getNestedDescription(valueDescription, utils.loggerPrintWidth),
          )
          .join('\n'),
      ].join('\n'),
    );
  }

  return chooseDescription(possibleDescriptions, utils.loggerPrintWidth);
};

function getNestedDescription(
  { description, valueTitle, valueDescriptions }: NormalizedExpectedResult,
  printWidth: number,
): string {
  const possibleDescriptions: string[] = [];

  if (description) {
    possibleDescriptions.push(`- ${chalk.blue(description)}`);
  }

  if (valueTitle) {
    possibleDescriptions.push(
      [`- ${chalk.blue(valueTitle)}:`]
        .concat(
          valueDescriptions.map(valueDescription =>
            getNestedDescription(
              valueDescription,
              printWidth - INDENTATION.length,
            ).replace(/^|\n/g, `$&${INDENTATION}`),
          ),
        )
        .join('\n'),
    );
  }

  return chooseDescription(possibleDescriptions, printWidth);
}

function chooseDescription(possibleDescriptions: string[], printWidth: number) {
  return possibleDescriptions.length === 1
    ? possibleDescriptions[0]
    : possibleDescriptions[0].length > printWidth
      ? possibleDescriptions[1]
      : possibleDescriptions[0];
}
