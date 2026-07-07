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
  NativeTokenAllowanceContext,
  NativeTokenAllowanceMetadata,
  NativeTokenAllowancePermission,
  NativeTokenAllowancePermissionRequest,
  PopulatedNativeTokenAllowancePermission,
} from './types';
import { parseAndValidate } from './validation';
import type { PermissionModule } from '../../core/permission/PermissionModule';

export const nativeTokenAllowancePermissionModule: PermissionModule<
  NativeTokenAllowancePermissionRequest,
  NativeTokenAllowanceContext,
  NativeTokenAllowanceMetadata,
  NativeTokenAllowancePermission,
  PopulatedNativeTokenAllowancePermission
> = {
  type: 'native-token-allowance',
  rules: allRules,
  title: 'permissionRequestTitle',
  subtitle: 'permissionRequestSubtitle',
  parseAndValidate,
  buildContext,
  deriveMetadata,
  renderBody,
  applyContext,
  populatePermission,
  createPermissionCaveats,
};
