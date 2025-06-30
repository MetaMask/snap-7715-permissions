import { type Hex } from '@metamask/delegation-core';

export type BasePermissionRequest = {
  justification: string;
  startTime: number;
  expiry: number;
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

export type PermissionRequest =
  | NativeTokenStreamPermissionRequest
  | ERC20TokenStreamPermissionRequest
  | NativeTokenPeriodicPermissionRequest
  | ERC20TokenPeriodicPermissionRequest;
