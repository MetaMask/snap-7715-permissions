import { createTokenApprovalRevocationCaveats as createPermissionCaveats } from '@metamask/7715-permission-types';

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
import type { PermissionModule } from '../../core/permission/PermissionModule';

export const tokenApprovalRevocationPermissionModule: PermissionModule<
  TokenApprovalRevocationPermissionRequest,
  TokenApprovalRevocationContext,
  TokenApprovalRevocationMetadata,
  TokenApprovalRevocationPermission,
  PopulatedTokenApprovalRevocationPermission
> = {
  type: 'token-approval-revocation',
  name: 'Token Approval Revocation',
  rules: allRules,
  title: 'permissionRequestTitle',
  subtitle: 'permissionRequestSubtitleRevocation',
  showTokenBalance: false,
  parseAndValidate,
  buildContext,
  deriveMetadata,
  renderBody,
  applyContext,
  populatePermission,
  createPermissionCaveats,
};
