import { apiDescriptor } from './descriptors/api.js'
import { commonDeprecatedHandler } from './handlers/deprecated/common.js'
import { commonInvalidHandler } from './handlers/invalid/index.js'
import { levenUnknownHandler } from './handlers/unknown/leven.js'
import {
  DeprecatedHandler,
  Descriptor,
  InvalidHandler,
  UnknownHandler,
} from './types.js'

export const defaultDescriptor: Descriptor = apiDescriptor
export const defaultUnknownHandler: UnknownHandler = levenUnknownHandler
export const defaultInvalidHandler: InvalidHandler = commonInvalidHandler
export const defaultDeprecatedHandler: DeprecatedHandler =
  commonDeprecatedHandler
