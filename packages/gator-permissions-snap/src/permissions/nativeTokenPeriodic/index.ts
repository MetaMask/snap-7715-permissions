import { createNativeTokenPeriodicCaveats } from '@metamask/7715-permission-types';
import type { Caveat } from '@metamask/delegation-core';

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
import type { DelegationContracts } from '../../core/chainMetadata';
import type { PermissionModule } from '../../core/permission/PermissionModule';

const createPermissionCaveats = ({
  permission,
  contracts,
}: {
  permission: PopulatedNativeTokenPeriodicPermission;
  contracts: DelegationContracts;
}): Caveat[] =>
  createNativeTokenPeriodicCaveats({
    permission,
    contracts: {
      ...contracts,
      nativeTokenPeriodicEnforcer: contracts.nativeTokenPeriodTransferEnforcer,
    },
  });

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
