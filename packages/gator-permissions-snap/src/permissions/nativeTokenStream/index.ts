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
  NativeTokenStreamContext,
  NativeTokenStreamMetadata,
  NativeTokenStreamPermission,
  NativeTokenStreamPermissionRequest,
  PopulatedNativeTokenStreamPermission,
} from './types';
import { parseAndValidate } from './validation';
import { DEFAULT_CONFIRMATION_SHELL_CONFIG } from '../../core/confirmation/ConfirmationShellConfig';
import type { PermissionModule } from '../../core/permission/PermissionModule';

export const nativeTokenStreamPermissionModule: PermissionModule<
  NativeTokenStreamPermissionRequest,
  NativeTokenStreamContext,
  NativeTokenStreamMetadata,
  NativeTokenStreamPermission,
  PopulatedNativeTokenStreamPermission
> = {
  type: 'native-token-stream',
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
