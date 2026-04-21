import type {
  Erc20TokenRevocationContext,
  Erc20TokenRevocationMetadata,
} from './types';
import { t as translate } from '../../utils/i18n';
import { createExpiryRule, createRedeemerRule } from '../rules';

export const EXPIRY_ELEMENT = 'erc20-token-revocation-expiry';
export const REDEEMER_ELEMENT = 'erc20-token-revocation-redeemer';

export const expiryRule = createExpiryRule<
  Erc20TokenRevocationContext,
  Erc20TokenRevocationMetadata
>({
  elementName: EXPIRY_ELEMENT,
  translate,
});

export const redeemerRule = createRedeemerRule<
  Erc20TokenRevocationContext,
  Erc20TokenRevocationMetadata
>({
  elementName: REDEEMER_ELEMENT,
  translate,
});

export const allRules = [expiryRule, redeemerRule];
