import { type Hex } from 'viem';

export type BasePermissionRequest = {
  justification: string | null;
  startTime: number | null;
  expiry: number | null;
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

export type ERC20TokenRevocationPermissionRequest = BasePermissionRequest & {
  type: 'erc20-token-revocation';
};

export type PermissionRequest =
  | NativeTokenStreamPermissionRequest
  | NativeTokenPeriodicPermissionRequest
  | ERC20TokenPeriodicPermissionRequest
  | ERC20TokenRevocationPermissionRequest
  | ERC20TokenStreamPermissionRequest;
