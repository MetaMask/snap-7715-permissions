import type {
  TokenApprovalRevocationContext,
  TokenApprovalRevocationMetadata,
} from './types';
import { t as translate } from '../../utils/i18n';
import { createExpiryRule } from '../rules';

export const EXPIRY_ELEMENT = 'token-approval-revocation-expiry';

export const expiryRule = createExpiryRule<
  TokenApprovalRevocationContext,
  TokenApprovalRevocationMetadata
>({
  elementName: EXPIRY_ELEMENT,
  translate,
});

export const allRules = [expiryRule];
