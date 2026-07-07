import { createPermissionCaveats } from './caveats';
import { renderBody } from './content';
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
import { parseAndValidate } from './validation';
import { DEFAULT_CONFIRMATION_SHELL_CONFIG } from '../../core/confirmation/ConfirmationShellConfig';
import type { PermissionModule } from '../../core/permission/PermissionModule';

export const nativeTokenPeriodicPermissionModule: PermissionModule<
  NativeTokenPeriodicPermissionRequest,
  NativeTokenPeriodicContext,
  NativeTokenPeriodicMetadata,
  NativeTokenPeriodicPermission,
  PopulatedNativeTokenPeriodicPermission
> = {
  type: 'native-token-periodic',
  rules: allRules,
  title: 'permissionRequestTitle',
  subtitle: 'permissionRequestSubtitle',
  confirmationShell: DEFAULT_CONFIRMATION_SHELL_CONFIG,
  parseAndValidate,
  buildContext,
  deriveMetadata,
  renderBody,
  applyContext,
  populatePermission,
  createPermissionCaveats,
};
