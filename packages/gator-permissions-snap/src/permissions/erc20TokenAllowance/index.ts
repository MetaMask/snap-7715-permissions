import { createPermissionCaveats } from './caveats';
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
import type { PermissionDefinition } from '../../core/types';

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
