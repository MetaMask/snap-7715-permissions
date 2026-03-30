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
import { getSupportedChains, parseAndValidatePermission } from './validation';
import type { PermissionDefinition } from '../../core/types';

export const erc20TokenStreamPermissionDefinition: PermissionDefinition<
  Erc20TokenStreamPermissionRequest,
  Erc20TokenStreamContext,
  Erc20TokenStreamMetadata,
  Erc20TokenStreamPermission,
  PopulatedErc20TokenStreamPermission
> = {
  rules: allRules,
  title: 'permissionRequestTitle',
  subtitle: 'permissionRequestSubtitle',
  getSupportedChains,
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
