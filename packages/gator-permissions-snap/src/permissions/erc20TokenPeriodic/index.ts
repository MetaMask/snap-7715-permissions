import { createErc20TokenPeriodicCaveats } from '@metamask/7715-permission-types';
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
  Erc20TokenPeriodicContext,
  Erc20TokenPeriodicMetadata,
  Erc20TokenPeriodicPermission,
  Erc20TokenPeriodicPermissionRequest,
  PopulatedErc20TokenPeriodicPermission,
} from './types';
import { parseAndValidatePermission } from './validation';
import type { DelegationContracts } from '../../core/chainMetadata';
import type { PermissionDefinition } from '../../core/types';

const createPermissionCaveats = async ({
  permission,
  contracts,
}: {
  permission: PopulatedErc20TokenPeriodicPermission;
  contracts: DelegationContracts;
}): Promise<Caveat[]> =>
  createErc20TokenPeriodicCaveats({
    permission,
    contracts: {
      erc20PeriodicEnforcer: contracts.erc20PeriodTransferEnforcer,
      valueLteEnforcer: contracts.valueLteEnforcer,
    },
  });

export const erc20TokenPeriodicPermissionDefinition: PermissionDefinition<
  Erc20TokenPeriodicPermissionRequest,
  Erc20TokenPeriodicContext,
  Erc20TokenPeriodicMetadata,
  Erc20TokenPeriodicPermission,
  PopulatedErc20TokenPeriodicPermission
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
