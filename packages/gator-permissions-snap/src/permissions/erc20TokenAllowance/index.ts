import { createErc20TokenAllowanceCaveats } from '@metamask/7715-permission-types';
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
  Erc20TokenAllowanceContext,
  Erc20TokenAllowanceMetadata,
  Erc20TokenAllowancePermission,
  Erc20TokenAllowancePermissionRequest,
  PopulatedErc20TokenAllowancePermission,
} from './types';
import { parseAndValidate } from './validation';
import type { DelegationContracts } from '../../core/chainMetadata';
import type { PermissionModule } from '../../core/permission/PermissionModule';

const createPermissionCaveats = ({
  permission,
  contracts,
}: {
  permission: PopulatedErc20TokenAllowancePermission;
  contracts: DelegationContracts;
}): Caveat[] =>
  createErc20TokenAllowanceCaveats({
    permission,
    contracts: {
      ...contracts,
      erc20PeriodicEnforcer: contracts.erc20PeriodTransferEnforcer,
    },
  });

export const erc20TokenAllowancePermissionModule: PermissionModule<
  Erc20TokenAllowancePermissionRequest,
  Erc20TokenAllowanceContext,
  Erc20TokenAllowanceMetadata,
  Erc20TokenAllowancePermission,
  PopulatedErc20TokenAllowancePermission
> = {
  type: 'erc20-token-allowance',
  name: 'ERC20 Token Allowance',
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
