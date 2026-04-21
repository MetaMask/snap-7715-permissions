/* eslint-disable jsdoc/require-jsdoc -- internal formatters mirror @metamask/smart-accounts-kit */
// @TODO: remove this file and export the main function from @metamask/smart-accounts-kit once it's published and available for use in the site package
import { getAddress, isHex, toHex } from 'viem';
import type { Hex } from 'viem';

type ExecutionPermissionType =
  | 'native-token-stream'
  | 'erc20-token-stream'
  | 'native-token-periodic'
  | 'erc20-token-periodic'
  | 'erc20-token-revocation';

function isDefined<Value>(value: Value): value is NonNullable<Value> {
  return value !== undefined && value !== null;
}

function toHexOrThrow(value: bigint | Hex, parameterName: string): Hex {
  if (!isDefined(value)) {
    throw new Error(`Invalid parameters: ${parameterName} is required`);
  }
  if (typeof value === 'string') {
    if (!isHex(value)) {
      throw new Error(
        `Invalid parameters: ${parameterName} is not a valid hex value`,
      );
    }
    return value;
  }
  return toHex(value);
}

/**
 * Builds ERC-7715 `rules`, including `expiry` and optional `redeemer` entries.
 *
 * @param expiry - Permission expiry timestamp in seconds, or null/undefined when absent.
 * @param redeemerAddresses - Checksum redeemer addresses; omit or pass empty for no redeemer rule.
 * @returns Wire-format rule objects for `wallet_requestExecutionPermissions`.
 */
export function buildExecutionPermissionRules(
  expiry: number | null | undefined,
  redeemerAddresses: Hex[] | undefined,
): { type: string; data: Record<string, unknown> }[] {
  const rules: { type: string; data: Record<string, unknown> }[] = [];
  if (isDefined(expiry)) {
    rules.push({
      type: 'expiry',
      data: { timestamp: expiry },
    });
  }
  if (redeemerAddresses?.length) {
    const addresses = redeemerAddresses.map((a) => getAddress(a));
    rules.push({
      type: 'redeemer',
      data: { addresses },
    });
  }
  return rules;
}

type PermissionParameter = {
  type: string;
  data: Record<string, unknown>;
};

type PermissionFormatter = (params: {
  permission: PermissionParameter;
  isAdjustmentAllowed: boolean;
}) => Record<string, unknown>;

function getPermissionFormatter(permissionType: string): PermissionFormatter {
  switch (permissionType) {
    case 'native-token-stream':
      return ({ permission, isAdjustmentAllowed }) =>
        formatNativeTokenStreamPermission({ permission, isAdjustmentAllowed });
    case 'erc20-token-stream':
      return ({ permission, isAdjustmentAllowed }) =>
        formatErc20TokenStreamPermission({ permission, isAdjustmentAllowed });
    case 'native-token-periodic':
      return ({ permission, isAdjustmentAllowed }) =>
        formatNativeTokenPeriodicPermission({
          permission,
          isAdjustmentAllowed,
        });
    case 'erc20-token-periodic':
      return ({ permission, isAdjustmentAllowed }) =>
        formatErc20TokenPeriodicPermission({ permission, isAdjustmentAllowed });
    case 'erc20-token-revocation':
      return ({ permission, isAdjustmentAllowed }) =>
        formatErc20TokenRevocationPermission({
          permission,
          isAdjustmentAllowed,
        });
    default:
      throw new Error(`Unsupported permission type: ${permissionType}`);
  }
}

function formatNativeTokenStreamPermission({
  permission,
  isAdjustmentAllowed,
}: {
  permission: PermissionParameter;
  isAdjustmentAllowed: boolean;
}) {
  const {
    data: {
      initialAmount,
      justification,
      maxAmount,
      startTime,
      amountPerSecond,
    },
  } = permission as unknown as {
    data: {
      initialAmount?: bigint;
      justification?: string;
      maxAmount?: bigint;
      startTime?: number;
      amountPerSecond: bigint;
    };
  };

  const optionalFields = {
    ...(isDefined(initialAmount) && {
      initialAmount: toHexOrThrow(initialAmount, 'initialAmount'),
    }),
    ...(isDefined(maxAmount) && {
      maxAmount: toHexOrThrow(maxAmount, 'maxAmount'),
    }),
    ...(isDefined(startTime) && {
      startTime: Number(startTime),
    }),
    ...(justification ? { justification } : {}),
  };
  return {
    type: 'native-token-stream',
    data: {
      amountPerSecond: toHexOrThrow(amountPerSecond, 'amountPerSecond'),
      ...optionalFields,
    },
    isAdjustmentAllowed,
  };
}

function formatErc20TokenStreamPermission({
  permission,
  isAdjustmentAllowed,
}: {
  permission: PermissionParameter;
  isAdjustmentAllowed: boolean;
}) {
  const {
    data: {
      tokenAddress,
      amountPerSecond,
      initialAmount,
      startTime,
      maxAmount,
      justification,
    },
  } = permission as unknown as {
    data: {
      tokenAddress: Hex;
      amountPerSecond: Hex | bigint;
      initialAmount?: Hex | bigint;
      startTime?: number;
      maxAmount?: Hex | bigint;
      justification?: string;
    };
  };

  const optionalFields = {
    ...(isDefined(initialAmount) && {
      initialAmount: toHexOrThrow(initialAmount, 'initialAmount'),
    }),
    ...(isDefined(maxAmount) && {
      maxAmount: toHexOrThrow(maxAmount, 'maxAmount'),
    }),
    ...(isDefined(startTime) && {
      startTime: Number(startTime),
    }),
    ...(justification ? { justification } : {}),
  };
  return {
    type: 'erc20-token-stream',
    data: {
      tokenAddress: toHexOrThrow(tokenAddress, 'tokenAddress'),
      amountPerSecond: toHexOrThrow(amountPerSecond, 'amountPerSecond'),
      ...optionalFields,
    },
    isAdjustmentAllowed,
  };
}

function formatNativeTokenPeriodicPermission({
  permission,
  isAdjustmentAllowed,
}: {
  permission: PermissionParameter;
  isAdjustmentAllowed: boolean;
}) {
  const {
    data: { periodAmount, periodDuration, startTime, justification },
  } = permission as unknown as {
    data: {
      periodAmount: Hex | bigint;
      periodDuration: number;
      startTime?: number;
      justification?: string;
    };
  };

  const optionalFields = {
    ...(isDefined(startTime) && {
      startTime: Number(startTime),
    }),
    ...(justification ? { justification } : {}),
  };
  return {
    type: 'native-token-periodic',
    data: {
      periodAmount: toHexOrThrow(periodAmount, 'periodAmount'),
      periodDuration: Number(periodDuration),
      ...optionalFields,
    },
    isAdjustmentAllowed,
  };
}

function formatErc20TokenPeriodicPermission({
  permission,
  isAdjustmentAllowed,
}: {
  permission: PermissionParameter;
  isAdjustmentAllowed: boolean;
}) {
  const {
    data: {
      tokenAddress,
      periodAmount,
      periodDuration,
      startTime,
      justification,
    },
  } = permission as unknown as {
    data: {
      tokenAddress: Hex;
      periodAmount: Hex | bigint;
      periodDuration: number;
      startTime?: number;
      justification?: string;
    };
  };

  const optionalFields = {
    ...(isDefined(startTime) && {
      startTime: Number(startTime),
    }),
    ...(justification ? { justification } : {}),
  };
  return {
    type: 'erc20-token-periodic',
    data: {
      tokenAddress: toHexOrThrow(tokenAddress, 'tokenAddress'),
      periodAmount: toHexOrThrow(periodAmount, 'periodAmount'),
      periodDuration: Number(periodDuration),
      ...optionalFields,
    },
    isAdjustmentAllowed,
  };
}

function formatErc20TokenRevocationPermission({
  permission,
  isAdjustmentAllowed,
}: {
  permission: PermissionParameter;
  isAdjustmentAllowed: boolean;
}) {
  const {
    data: { justification },
  } = permission as unknown as { data: { justification?: string } };

  const data = {
    ...(justification ? { justification } : {}),
  };
  return {
    type: 'erc20-token-revocation',
    data,
    isAdjustmentAllowed,
  };
}

export type FormatExecutionPermissionRequestForWalletParameters = {
  chainId: number;
  to: Hex;
  from?: Hex | null;
  expiry: number | null | undefined;
  isAdjustmentAllowed: boolean;
  redeemerAddresses?: Hex[] | null;
  permission: {
    type: ExecutionPermissionType;
    data: Record<string, unknown>;
  };
};

/**
 * Formats a `wallet_requestExecutionPermissions` parameter object, matching
 * `@metamask/smart-accounts-kit` and appending `redeemer` rules when provided.
 *
 * @param parameters - Raw permission request fields from the dev site.
 * @returns JSON-RPC-ready permission request payload.
 */
export function formatExecutionPermissionRequestForWallet(
  parameters: FormatExecutionPermissionRequestForWalletParameters,
) {
  const { chainId, from, expiry, isAdjustmentAllowed, redeemerAddresses } =
    parameters;

  const permissionFormatter = getPermissionFormatter(
    parameters.permission.type,
  );

  const rules = buildExecutionPermissionRules(
    expiry,
    redeemerAddresses ?? undefined,
  );

  const optionalFields = from ? { from } : {};

  return {
    ...optionalFields,
    chainId: toHex(chainId),
    permission: permissionFormatter({
      permission: parameters.permission,
      isAdjustmentAllowed,
    }),
    to: parameters.to,
    rules,
  };
}
