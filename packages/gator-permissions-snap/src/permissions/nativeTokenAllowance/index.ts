import { createNativeTokenAllowanceCaveats } from '@metamask/7715-permission-types';
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
  NativeTokenAllowanceContext,
  NativeTokenAllowanceMetadata,
  NativeTokenAllowancePermission,
  NativeTokenAllowancePermissionRequest,
  PopulatedNativeTokenAllowancePermission,
} from './types';
import { parseAndValidate } from './validation';
import type { DelegationContracts } from '../../core/chainMetadata';
import type { PermissionModule } from '../../core/permission/PermissionModule';

const createPermissionCaveats = ({
  permission,
  contracts,
}: {
  permission: PopulatedNativeTokenAllowancePermission;
  contracts: DelegationContracts;
}): Caveat[] =>
  createNativeTokenAllowanceCaveats({
    permission,
    contracts: {
      ...contracts,
      nativeTokenPeriodicEnforcer: contracts.nativeTokenPeriodTransferEnforcer,
    },
  });

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
