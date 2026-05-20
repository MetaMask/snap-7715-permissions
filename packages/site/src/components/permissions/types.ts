import type { Hex } from 'viem';

export type BasePermissionRequest = {
  justification: string | null;
  startTime: number | null;
  expiry: number | null;
  /** Addresses that may redeem this permission; sent as a `redeemer` rule. */
  redeemerAddresses: Hex[] | null;
  /** Addresses to which payments may be sent; sent as a `payee` rule. */
  payeeAddresses: Hex[] | null;
  isAdjustmentAllowed: boolean;
};

export type NativeTokenStreamPermissionRequest = BasePermissionRequest & {
  type: 'native-token-stream';
  initialAmount: bigint | null;
  amountPerSecond: bigint;
  maxAmount: bigint | null;
};

export type ERC20TokenStreamPermissionRequest = BasePermissionRequest & {
  type: 'erc20-token-stream';
  initialAmount: Hex | null;
  amountPerSecond: Hex;
  maxAmount: Hex | null;
  tokenAddress: Hex;
};

export type NativeTokenPeriodicPermissionRequest = BasePermissionRequest & {
  type: 'native-token-periodic';
  periodAmount: Hex;
  periodDuration: number;
};

export type ERC20TokenPeriodicPermissionRequest = BasePermissionRequest & {
  type: 'erc20-token-periodic';
  periodAmount: Hex;
  periodDuration: number;
  tokenAddress: Hex;
};

export type NativeTokenAllowancePermissionRequest = BasePermissionRequest & {
  type: 'native-token-allowance';
  allowanceAmount: Hex;
};

export type ERC20TokenAllowancePermissionRequest = BasePermissionRequest & {
  type: 'erc20-token-allowance';
  allowanceAmount: Hex;
  tokenAddress: Hex;
};

export type TokenApprovalRevocationPermissionRequest = BasePermissionRequest & {
  type: 'token-approval-revocation';
  erc20Approve: boolean;
  erc721Approve: boolean;
  erc721SetApprovalForAll: boolean;
  permit2Approve: boolean;
  permit2Lockdown: boolean;
  permit2InvalidateNonces: boolean;
};

export type TokenApprovalRevocationPrimitive = Pick<
  TokenApprovalRevocationPermissionRequest,
  | 'erc20Approve'
  | 'erc721Approve'
  | 'erc721SetApprovalForAll'
  | 'permit2Approve'
  | 'permit2Lockdown'
  | 'permit2InvalidateNonces'
>;

export type TokenApprovalRevocationPrimitiveKey =
  keyof TokenApprovalRevocationPrimitive;

export const TOKEN_APPROVAL_REVOCATION_PRIMITIVES = [
  { key: 'erc20Approve', label: 'ERC-20 approve(spender, 0)' },
  { key: 'erc721Approve', label: 'ERC-721 approve(address(0), tokenId)' },
  {
    key: 'erc721SetApprovalForAll',
    label: 'ERC-721/ERC-1155 setApprovalForAll(false)',
  },
  { key: 'permit2Approve', label: 'Permit2 approve(token, spender, 0, 0)' },
  { key: 'permit2Lockdown', label: 'Permit2 lockdown' },
  { key: 'permit2InvalidateNonces', label: 'Permit2 invalidate nonces' },
] as const satisfies readonly {
  key: TokenApprovalRevocationPrimitiveKey;
  label: string;
}[];

export type PermissionRequest =
  | NativeTokenStreamPermissionRequest
  | NativeTokenPeriodicPermissionRequest
  | NativeTokenAllowancePermissionRequest
  | ERC20TokenPeriodicPermissionRequest
  | ERC20TokenAllowancePermissionRequest
  | TokenApprovalRevocationPermissionRequest
  | ERC20TokenStreamPermissionRequest;
