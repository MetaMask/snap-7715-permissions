import { createNativeTokenAllowanceCaveats as createPermissionCaveats } from '@metamask/7715-permission-types';

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
import { primaryTokenCaip19Selector } from '../../core/token/tokenSelectors';

export const nativeTokenAllowancePermissionModule: PermissionModule<
  NativeTokenAllowancePermissionRequest,
  NativeTokenAllowanceContext,
  NativeTokenAllowanceMetadata,
  NativeTokenAllowancePermission,
  PopulatedNativeTokenAllowancePermission
> = {
  type: 'native-token-allowance',
  name: 'Native Token Allowance',
  rules: allRules,
  tokenCaip19s: [primaryTokenCaip19Selector],
  balanceTokenCaip19: primaryTokenCaip19Selector,
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
