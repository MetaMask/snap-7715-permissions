import { createNativeTokenPeriodicCaveats } from '@metamask/7715-permission-types';
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
  NativeTokenPeriodicContext,
  NativeTokenPeriodicMetadata,
  NativeTokenPeriodicPermission,
  NativeTokenPeriodicPermissionRequest,
  PopulatedNativeTokenPeriodicPermission,
} from './types';
import { parseAndValidatePermission } from './validation';
import type { DelegationContracts } from '../../core/chainMetadata';
import type { PermissionDefinition } from '../../core/types';

const createPermissionCaveats = async ({
  permission,
  contracts,
}: {
  permission: PopulatedNativeTokenPeriodicPermission;
  contracts: DelegationContracts;
}): Promise<Caveat[]> =>
  createNativeTokenPeriodicCaveats({
    permission,
    contracts: {
      nativeTokenPeriodicEnforcer: contracts.nativeTokenPeriodTransferEnforcer,
      exactCalldataEnforcer: contracts.exactCalldataEnforcer,
    },
  });

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
