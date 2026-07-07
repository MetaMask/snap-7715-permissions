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
  Erc20TokenPeriodicContext,
  Erc20TokenPeriodicMetadata,
  Erc20TokenPeriodicPermission,
  Erc20TokenPeriodicPermissionRequest,
  PopulatedErc20TokenPeriodicPermission,
} from './types';
import { parseAndValidate } from './validation';
import { DEFAULT_CONFIRMATION_SHELL_CONFIG } from '../../core/confirmation/ConfirmationShellConfig';
import type { PermissionModule } from '../../core/permission/PermissionModule';

export const erc20TokenPeriodicPermissionModule: PermissionModule<
  Erc20TokenPeriodicPermissionRequest,
  Erc20TokenPeriodicContext,
  Erc20TokenPeriodicMetadata,
  Erc20TokenPeriodicPermission,
  PopulatedErc20TokenPeriodicPermission
> = {
  type: 'erc20-token-periodic',
  rules: allRules,
  title: 'permissionRequestTitle',
  subtitle: 'permissionRequestSubtitle',
  confirmationShell: DEFAULT_CONFIRMATION_SHELL_CONFIG,
  parseAndValidate,
  buildContext,
  deriveMetadata,
  renderBody,
  applyContext,
  populatePermission,
  createPermissionCaveats,
};
