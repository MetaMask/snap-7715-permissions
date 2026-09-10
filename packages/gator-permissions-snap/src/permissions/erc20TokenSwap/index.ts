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
  Erc20TokenSwapContext,
  Erc20TokenSwapMetadata,
  Erc20TokenSwapPermission,
  Erc20TokenSwapPermissionRequest,
  PopulatedErc20TokenSwapPermission,
} from './types';
import { parseAndValidate } from './validation';
import type { PermissionModule } from '../../core/permission/PermissionModule';

export const erc20TokenSwapPermissionModule: PermissionModule<
  Erc20TokenSwapPermissionRequest,
  Erc20TokenSwapContext,
  Erc20TokenSwapMetadata,
  Erc20TokenSwapPermission,
  PopulatedErc20TokenSwapPermission
> = {
  type: 'erc20-token-swap',
  name: 'ERC20 Token Swap',
  rules: allRules,
  title: 'permissionRequestTitle',
  subtitle: 'permissionRequestSubtitleErc20TokenSwap',
  parseAndValidate,
  buildContext,
  deriveMetadata,
  renderBody,
  applyContext,
  populatePermission,
  createPermissionCaveats,
};
