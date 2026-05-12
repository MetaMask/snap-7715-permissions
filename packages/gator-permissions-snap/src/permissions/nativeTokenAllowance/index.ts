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
  NativeTokenAllowanceContext,
  NativeTokenAllowanceMetadata,
  NativeTokenAllowancePermission,
  NativeTokenAllowancePermissionRequest,
  PopulatedNativeTokenAllowancePermission,
} from './types';
import { parseAndValidatePermission } from './validation';
import type { PermissionDefinition } from '../../core/types';

export const nativeTokenAllowancePermissionDefinition: PermissionDefinition<
  NativeTokenAllowancePermissionRequest,
  NativeTokenAllowanceContext,
  NativeTokenAllowanceMetadata,
  NativeTokenAllowancePermission,
  PopulatedNativeTokenAllowancePermission
> = {
  rules: allRules,
  title: 'permissionRequestTitle',
  subtitle: 'permissionRequestSubtitle',
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
