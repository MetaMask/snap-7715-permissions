/**
 * Maximum uint256 value for `periodDuration` in {@link @metamask/delegation-core}
 * period-transfer enforcer terms. The on-chain type is uint256; we encode a single
 * "unbounded" period so optional `expiry` (timestamp enforcer) can bound the delegation
 * like other permissions.
 */
export const PERIOD_TRANSFER_PERIOD_DURATION_UINT256_MAX = 2n ** 256n - 1n;
