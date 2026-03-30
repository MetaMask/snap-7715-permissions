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
  NativeTokenPeriodicContext,
  NativeTokenPeriodicMetadata,
  NativeTokenPeriodicPermission,
  NativeTokenPeriodicPermissionRequest,
  PopulatedNativeTokenPeriodicPermission,
} from './types';
import { getSupportedChains, parseAndValidatePermission } from './validation';
import type { PermissionDefinition } from '../../core/types';

export const nativeTokenPeriodicPermissionDefinition: PermissionDefinition<
  NativeTokenPeriodicPermissionRequest,
  NativeTokenPeriodicContext,
  NativeTokenPeriodicMetadata,
  NativeTokenPeriodicPermission,
  PopulatedNativeTokenPeriodicPermission
> = {
  rules: allRules,
  title: 'permissionRequestTitle',
  subtitle: 'permissionRequestSubtitle',
  getSupportedChains,
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
