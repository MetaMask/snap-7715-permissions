import { createNativeTokenAllowanceCaveats } from '@metamask/7715-permission-types';
import type { Caveat } from '@metamask/delegation-core';

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
import type { DelegationContracts } from '../../core/chainMetadata';
import type { PermissionDefinition } from '../../core/types';

const createPermissionCaveats = async ({
  permission,
  contracts,
}: {
  permission: PopulatedNativeTokenAllowancePermission;
  contracts: DelegationContracts;
}): Promise<Caveat[]> =>
  createNativeTokenAllowanceCaveats({
    permission,
    contracts: {
      nativeTokenPeriodicEnforcer: contracts.nativeTokenPeriodTransferEnforcer,
      exactCalldataEnforcer: contracts.exactCalldataEnforcer,
    },
  });

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
