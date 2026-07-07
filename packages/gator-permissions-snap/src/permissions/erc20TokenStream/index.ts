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
  Erc20TokenStreamContext,
  Erc20TokenStreamMetadata,
  Erc20TokenStreamPermission,
  Erc20TokenStreamPermissionRequest,
  PopulatedErc20TokenStreamPermission,
} from './types';
import { parseAndValidate } from './validation';
import { DEFAULT_CONFIRMATION_SHELL_CONFIG } from '../../core/confirmation/ConfirmationShellConfig';
import type { PermissionModule } from '../../core/permission/PermissionModule';

export const erc20TokenStreamPermissionModule: PermissionModule<
  Erc20TokenStreamPermissionRequest,
  Erc20TokenStreamContext,
  Erc20TokenStreamMetadata,
  Erc20TokenStreamPermission,
  PopulatedErc20TokenStreamPermission
> = {
  type: 'erc20-token-stream',
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
