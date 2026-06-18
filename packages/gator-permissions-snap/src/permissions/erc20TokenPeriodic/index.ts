import { createErc20TokenPeriodicCaveats } from '@metamask/7715-permission-types';
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
  Erc20TokenPeriodicContext,
  Erc20TokenPeriodicMetadata,
  Erc20TokenPeriodicPermission,
  Erc20TokenPeriodicPermissionRequest,
  PopulatedErc20TokenPeriodicPermission,
} from './types';
import { parseAndValidate } from './validation';
import type { DelegationContracts } from '../../core/chainMetadata';
import type { PermissionModule } from '../../core/permission/PermissionModule';

const createPermissionCaveats = ({
  permission,
  contracts,
}: {
  permission: PopulatedErc20TokenPeriodicPermission;
  contracts: DelegationContracts;
}): Caveat[] =>
  createErc20TokenPeriodicCaveats({
    permission,
    contracts: {
      ...contracts,
      erc20PeriodicEnforcer: contracts.erc20PeriodTransferEnforcer,
    },
  });

export const erc20TokenPeriodicPermissionModule: PermissionModule<
  Erc20TokenPeriodicPermissionRequest,
  Erc20TokenPeriodicContext,
  Erc20TokenPeriodicMetadata,
  Erc20TokenPeriodicPermission,
  PopulatedErc20TokenPeriodicPermission
> = {
  type: 'erc20-token-periodic',
  name: 'ERC20 Token Periodic Transfer',
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
