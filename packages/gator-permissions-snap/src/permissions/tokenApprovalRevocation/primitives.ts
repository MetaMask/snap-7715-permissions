import type { Hex } from '@metamask/utils';

import type { MessageKey } from '../../utils/i18n';

export const TOKEN_APPROVAL_REVOCATION_PRIMITIVES = [
  {
    key: 'erc20Approve',
    bit: 0x01,
    labelKey: 'erc20ApproveRevocationLabel' satisfies MessageKey,
  },
  {
    key: 'erc721Approve',
    bit: 0x02,
    labelKey: 'erc721ApproveRevocationLabel' satisfies MessageKey,
  },
  {
    key: 'erc721SetApprovalForAll',
    bit: 0x04,
    labelKey: 'erc721SetApprovalForAllRevocationLabel' satisfies MessageKey,
  },
  {
    key: 'permit2Approve',
    bit: 0x08,
    labelKey: 'permit2ApproveRevocationLabel' satisfies MessageKey,
  },
  {
    key: 'permit2Lockdown',
    bit: 0x10,
    labelKey: 'permit2LockdownRevocationLabel' satisfies MessageKey,
  },
  {
    key: 'permit2InvalidateNonces',
    bit: 0x20,
    labelKey: 'permit2InvalidateNoncesRevocationLabel' satisfies MessageKey,
  },
] as const;

export type TokenApprovalRevocationPrimitiveKey =
  (typeof TOKEN_APPROVAL_REVOCATION_PRIMITIVES)[number]['key'];

export type TokenApprovalRevocationMechanisms = Record<
  TokenApprovalRevocationPrimitiveKey,
  boolean
>;

/**
 * Copies the revocation mechanism flags from permission data.
 * @param data - Permission data containing revocation mechanism flags.
 * @returns The revocation mechanism flags.
 */
export function getTokenApprovalRevocationMechanisms(
  data: TokenApprovalRevocationMechanisms,
): TokenApprovalRevocationMechanisms {
  return {
    erc20Approve: data.erc20Approve,
    erc721Approve: data.erc721Approve,
    erc721SetApprovalForAll: data.erc721SetApprovalForAll,
    permit2Approve: data.permit2Approve,
    permit2Lockdown: data.permit2Lockdown,
    permit2InvalidateNonces: data.permit2InvalidateNonces,
  };
}

/**
 * Checks whether at least one revocation mechanism is enabled.
 * @param data - Permission data containing revocation mechanism flags.
 * @returns True when at least one mechanism is enabled.
 */
export function hasTokenApprovalRevocationMechanism(
  data: TokenApprovalRevocationMechanisms,
): boolean {
  return TOKEN_APPROVAL_REVOCATION_PRIMITIVES.some(({ key }) => data[key]);
}

/**
 * Encodes ApprovalRevocationEnforcer terms from mechanism flags.
 * @param data - Permission data containing revocation mechanism flags.
 * @returns The one-byte ApprovalRevocationEnforcer terms bitmask.
 */
export function createTokenApprovalRevocationTerms(
  data: TokenApprovalRevocationMechanisms,
): Hex {
  const bitmask = TOKEN_APPROVAL_REVOCATION_PRIMITIVES.reduce(
    (result, { bit, key }) => result + (data[key] ? bit : 0),
    0,
  );

  return `0x${bitmask.toString(16).padStart(2, '0')}`;
}
