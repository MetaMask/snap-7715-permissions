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
  TokenApprovalRevocationContext,
  TokenApprovalRevocationMetadata,
  TokenApprovalRevocationPermission,
  TokenApprovalRevocationPermissionRequest,
  PopulatedTokenApprovalRevocationPermission,
} from './types';
import { parseAndValidate } from './validation';
import type { ConfirmationShellConfig } from '../../core/confirmation/ConfirmationShellConfig';
import type { PermissionModule } from '../../core/permission/PermissionModule';

const TOKEN_APPROVAL_REVOCATION_SHELL_CONFIG: ConfirmationShellConfig = {
  accountSelector: true,
  tokenBalance: false,
  accountUpgradeBanner: true,
  existingPermissionsReview: true,
};

export const tokenApprovalRevocationPermissionModule: PermissionModule<
  TokenApprovalRevocationPermissionRequest,
  TokenApprovalRevocationContext,
  TokenApprovalRevocationMetadata,
  TokenApprovalRevocationPermission,
  PopulatedTokenApprovalRevocationPermission
> = {
  type: 'token-approval-revocation',
  rules: allRules,
  title: 'permissionRequestTitle',
  subtitle: 'permissionRequestSubtitleRevocation',
  confirmationShell: TOKEN_APPROVAL_REVOCATION_SHELL_CONFIG,
  parseAndValidate,
  buildContext,
  deriveMetadata,
  renderBody,
  applyContext,
  populatePermission,
  createPermissionCaveats,
};
