import type {
  Erc20TokenRevocationContext,
  Erc20TokenRevocationMetadata,
} from './types';
import { t as translate } from '../../utils/i18n';
import { createExpiryRule } from '../rules';

export const EXPIRY_ELEMENT = 'erc20-token-revocation-expiry';

export const expiryRule = createExpiryRule<
  Erc20TokenRevocationContext,
  Erc20TokenRevocationMetadata
>({
  elementName: EXPIRY_ELEMENT,
  translate,
});

export const allRules = [expiryRule];
