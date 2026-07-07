import { createPermissionCaveats } from './caveats';
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
import type { PermissionModule } from '../../core/permission/PermissionModule';

export const erc20TokenAllowancePermissionModule: PermissionModule<
  Erc20TokenAllowancePermissionRequest,
  Erc20TokenAllowanceContext,
  Erc20TokenAllowanceMetadata,
  Erc20TokenAllowancePermission,
  PopulatedErc20TokenAllowancePermission
> = {
  type: 'erc20-token-allowance',
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
