import { createTokenApprovalRevocationCaveats as createPermissionCaveats } from '@metamask/7715-permission-types';

import { createConfirmationContent } from './content';
import {
  applyContext,
  buildContext,
  deriveMetadata,
  populatePermission,
} from './context';
import { allRules } from './rules';
import type {
  TokenApprovalRevocationContext,
  TokenApprovalRevocationMetadata,
  TokenApprovalRevocationPermission,
  TokenApprovalRevocationPermissionRequest,
  PopulatedTokenApprovalRevocationPermission,
} from './types';
import { parseAndValidatePermission } from './validation';
import type { PermissionDefinition } from '../../core/types';

export const tokenApprovalRevocationPermissionDefinition: PermissionDefinition<
  TokenApprovalRevocationPermissionRequest,
  TokenApprovalRevocationContext,
  TokenApprovalRevocationMetadata,
  TokenApprovalRevocationPermission,
  PopulatedTokenApprovalRevocationPermission
> = {
  rules: allRules,
  title: 'permissionRequestTitle',
  subtitle: 'permissionRequestSubtitleRevocation',
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
