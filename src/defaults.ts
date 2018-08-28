import { apiDescriptor } from './descriptors/api';
import { commonDeprecatedHandler } from './handlers/deprecated/common';
import { commonInvalidHandler } from './handlers/invalid';
import { levenUnknownHandler } from './handlers/unknown/leven';
import {
  DeprecatedHandler,
  Descriptor,
  InvalidHandler,
  UnknownHandler,
} from './types';

export const defaultDescriptor: Descriptor = apiDescriptor;
export const defaultUnknownHandler: UnknownHandler = levenUnknownHandler;
export const defaultInvalidHandler: InvalidHandler = commonInvalidHandler;
export const defaultDeprecatedHandler: DeprecatedHandler = commonDeprecatedHandler;
