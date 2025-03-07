import picocolors from 'picocolors'
import leven from 'leven'
import { UnknownHandler } from '../../types.js'

export const levenUnknownHandler: UnknownHandler = (
  key,
  value,
  { descriptor, logger, schemas },
) => {
  const messages = [
    `Ignored unknown option ${picocolors.yellow(descriptor.pair({ key, value }))}.`,
  ]

  const suggestion = Object.keys(schemas)
    .sort()
    .find(knownKey => leven(key, knownKey) < 3)

  if (suggestion) {
    messages.push(`Did you mean ${picocolors.blue(descriptor.key(suggestion))}?`)
  }

  logger.warn(messages.join(' '))
}
