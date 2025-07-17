import type { PermissionDefinition } from '../../core/types';
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
  Erc20TokenStreamContext,
  Erc20TokenStreamMetadata,
  Erc20TokenStreamPermission,
  Erc20TokenStreamPermissionRequest,
  PopulatedErc20TokenStreamPermission,
} from './types';
import { parseAndValidatePermission } from './validation';

export const erc20TokenStreamPermissionDefinition: PermissionDefinition<
  Erc20TokenStreamPermissionRequest,
  Erc20TokenStreamContext,
  Erc20TokenStreamMetadata,
  Erc20TokenStreamPermission,
  PopulatedErc20TokenStreamPermission
> = {
  rules: allRules,
  title: 'ERC20 token stream',
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
