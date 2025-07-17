import { createPermissionCaveats } from './caveats';
import { createConfirmationContent } from './content';
import {
  applyContext,
  buildContext,
  deriveMetadata,
  populatePermission,
} from './context';
import { allRules } from './rules';
import type {
  NativeTokenStreamContext,
  NativeTokenStreamMetadata,
  NativeTokenStreamPermission,
  NativeTokenStreamPermissionRequest,
  PopulatedNativeTokenStreamPermission,
} from './types';
import { parseAndValidatePermission } from './validation';
import type { PermissionDefinition } from '../../core/types';

export const nativeTokenStreamPermissionDefinition: PermissionDefinition<
  NativeTokenStreamPermissionRequest,
  NativeTokenStreamContext,
  NativeTokenStreamMetadata,
  NativeTokenStreamPermission,
  PopulatedNativeTokenStreamPermission
> = {
  rules: allRules,
  title: 'Native token stream',
  dependencies: {
    parseAndValidatePermission,
    buildContext,
    deriveMetadata,
    createConfirmationContent,
    applyContext,
    populatePermission,
    createPermissionCaveats,
  },
};
