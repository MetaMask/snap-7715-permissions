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
  NativeTokenSwapContext,
  NativeTokenSwapMetadata,
  NativeTokenSwapPermission,
  NativeTokenSwapPermissionRequest,
  PopulatedNativeTokenSwapPermission,
} from './types';
import { parseAndValidatePermission } from './validation';
import type { PermissionDefinition } from '../../core/types';

export const nativeTokenSwapPermissionDefinition: PermissionDefinition<
  NativeTokenSwapPermissionRequest,
  NativeTokenSwapContext,
  NativeTokenSwapMetadata,
  NativeTokenSwapPermission,
  PopulatedNativeTokenSwapPermission
> = {
  rules: allRules,
  title: 'permissionRequestTitle',
  subtitle: 'permissionRequestSubtitleNativeTokenSwap',
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
