import type {
  Erc20TokenRevocationContext,
  Erc20TokenRevocationMetadata,
} from './types';
import { createExpiryRule } from '../rules';

export const EXPIRY_ELEMENT = 'erc20-token-revocation-expiry';

export const expiryRule = createExpiryRule<
  Erc20TokenRevocationContext,
  Erc20TokenRevocationMetadata
>({
  elementName: EXPIRY_ELEMENT,
});

export const allRules = [expiryRule];
