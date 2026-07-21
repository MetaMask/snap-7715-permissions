import { createNativeTokenPeriodicCaveats as createPermissionCaveats } from '@metamask/7715-permission-types';

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
import type { PermissionModule } from '../../core/permission/PermissionModule';

export const nativeTokenPeriodicPermissionModule: PermissionModule<
  NativeTokenPeriodicPermissionRequest,
  NativeTokenPeriodicContext,
  NativeTokenPeriodicMetadata,
  NativeTokenPeriodicPermission,
  PopulatedNativeTokenPeriodicPermission
> = {
  type: 'native-token-periodic',
  name: 'Native Token Periodic Transfer',
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
