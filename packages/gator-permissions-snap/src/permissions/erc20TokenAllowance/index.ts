import { createErc20TokenAllowanceCaveats } from '@metamask/7715-permission-types';
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
  Erc20TokenAllowanceContext,
  Erc20TokenAllowanceMetadata,
  Erc20TokenAllowancePermission,
  Erc20TokenAllowancePermissionRequest,
  PopulatedErc20TokenAllowancePermission,
} from './types';
import { parseAndValidatePermission } from './validation';
import type { DelegationContracts } from '../../core/chainMetadata';
import type { PermissionDefinition } from '../../core/types';

const createPermissionCaveats = async ({
  permission,
  contracts,
}: {
  permission: PopulatedErc20TokenAllowancePermission;
  contracts: DelegationContracts;
}): Promise<Caveat[]> =>
  createErc20TokenAllowanceCaveats({
    permission,
    contracts: {
      erc20PeriodicEnforcer: contracts.erc20PeriodTransferEnforcer,
      valueLteEnforcer: contracts.valueLteEnforcer,
    },
  });

export const erc20TokenAllowancePermissionDefinition: PermissionDefinition<
  Erc20TokenAllowancePermissionRequest,
  Erc20TokenAllowanceContext,
  Erc20TokenAllowanceMetadata,
  Erc20TokenAllowancePermission,
  PopulatedErc20TokenAllowancePermission
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
