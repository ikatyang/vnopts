import chalk from 'chalk';
import { DeprecatedHandler } from '../../types';

export const commonDeprecatedHandler: DeprecatedHandler = (
  keyOrPair,
  redirectTo,
  { descriptor },
) => {
  const messages = [
    `${chalk.yellow(
      typeof keyOrPair === 'string'
        ? descriptor.key(keyOrPair)
        : descriptor.pair(keyOrPair),
    )} is deprecated`,
  ];

  if (redirectTo) {
    messages.push(
      `we now treat it as ${chalk.blue(
        typeof redirectTo === 'string'
          ? descriptor.key(redirectTo)
          : descriptor.pair(redirectTo),
      )}`,
    );
  }

  return messages.join(', ') + '.';
};
