import { getSmartAccountsEnvironment } from '@metamask/smart-accounts-kit';
import {
  decodeCaveat,
  decodeDelegations,
} from '@metamask/smart-accounts-kit/utils';
import type { Hex } from 'viem';

export type DecodedPermissionContext = unknown[][];

type PermissionResponseEntry = {
  chainId?: unknown;
  context?: unknown;
};

const isPermissionResponseEntry = (
  value: unknown,
): value is PermissionResponseEntry =>
  typeof value === 'object' && value !== null;

const getResponseChainId = (
  responseEntry: PermissionResponseEntry,
  fallbackChainId: number,
): number => {
  const responseChainId =
    typeof responseEntry.chainId === 'number'
      ? responseEntry.chainId
      : Number(responseEntry.chainId);

  return Number.isNaN(responseChainId) ? fallbackChainId : responseChainId;
};

export const decodePermissionContext = (
  permissionResponse: unknown,
  fallbackChainId: number,
): DecodedPermissionContext | null => {
  if (!Array.isArray(permissionResponse)) {
    return null;
  }

  return permissionResponse.map((responseEntry) => {
    if (!isPermissionResponseEntry(responseEntry)) {
      return [];
    }

    const permissionContext = responseEntry.context;

    if (typeof permissionContext !== 'string') {
      return [];
    }

    try {
      const delegations = decodeDelegations(permissionContext as Hex);
      const environment = getSmartAccountsEnvironment(
        getResponseChainId(responseEntry, fallbackChainId),
      );

      return delegations.map((delegation) => ({
        ...delegation,
        caveats: (delegation.caveats ?? []).map((caveat) => {
          try {
            return decodeCaveat({
              caveat,
              environment,
            });
          } catch {
            return caveat;
          }
        }),
      }));
    } catch {
      return [];
    }
  });
};
