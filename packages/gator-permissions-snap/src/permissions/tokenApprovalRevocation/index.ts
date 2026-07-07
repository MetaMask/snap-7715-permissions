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
  TokenApprovalRevocationContext,
  TokenApprovalRevocationMetadata,
  TokenApprovalRevocationPermission,
  TokenApprovalRevocationPermissionRequest,
  PopulatedTokenApprovalRevocationPermission,
} from './types';
import { parseAndValidatePermission } from './validation';
import type { ConfirmationShellConfig } from '../../core/confirmation/ConfirmationShellConfig';
import type { PermissionDefinition } from '../../core/types';

const TOKEN_APPROVAL_REVOCATION_SHELL_CONFIG: ConfirmationShellConfig = {
  accountSelector: true,
  tokenBalance: false,
  accountUpgradeBanner: true,
  existingPermissionsReview: true,
};

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
  confirmationShell: TOKEN_APPROVAL_REVOCATION_SHELL_CONFIG,
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
