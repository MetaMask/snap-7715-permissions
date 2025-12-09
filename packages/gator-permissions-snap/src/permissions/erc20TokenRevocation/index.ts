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
  Erc20TokenRevocationContext,
  Erc20TokenRevocationMetadata,
  Erc20TokenRevocationPermission,
  Erc20TokenRevocationPermissionRequest,
  PopulatedErc20TokenRevocationPermission,
} from './types';
import { parseAndValidatePermission } from './validation';
import type { PermissionDefinition } from '../../core/types';

export const erc20TokenRevocationPermissionDefinition: PermissionDefinition<
  Erc20TokenRevocationPermissionRequest,
  Erc20TokenRevocationContext,
  Erc20TokenRevocationMetadata,
  Erc20TokenRevocationPermission,
  PopulatedErc20TokenRevocationPermission
> = {
  rules: allRules,
  title: 'Permission request',
  subtitle:
    'This site wants permissions to revoke your ERC-20 token approvals.',
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
