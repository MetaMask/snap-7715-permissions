import type { PermissionDefinition } from '../../core/types';
import { appendCaveats } from './caveats';
import { createConfirmationContent } from './content';
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
import { parseAndValidatePermission } from './validation';

export const erc20TokenPeriodicPermissionDefinition: PermissionDefinition<
  Erc20TokenPeriodicPermissionRequest,
  Erc20TokenPeriodicContext,
  Erc20TokenPeriodicMetadata,
  Erc20TokenPeriodicPermission,
  PopulatedErc20TokenPeriodicPermission
> = {
  rules: allRules,
  title: 'ERC20 token periodic transfer',
  dependencies: {
    parseAndValidatePermission,
    buildContext,
    deriveMetadata,
    createConfirmationContent,
    applyContext,
    populatePermission,
    appendCaveats,
  },
};
