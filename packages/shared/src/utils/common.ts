import type { Address, Hex } from 'viem';

import type { PermissionRequestIteratorItem } from '../iterator';
import type { TypeDescriptor } from '../types';

/**
 * Extracts the name of a permission from a permission type.
 *
 * @param type - The type of permission to extract the name from.
 * @returns The name of the permission.
 */
export const extractPermissionName = (type: TypeDescriptor): string => {
  if (typeof type === 'object') {
    return type.name;
  }
  return type;
};

/**
 * Moves the item at the specified index to the first index in the array.
 *
 * @param arr - The array to move the item in.
 * @param index - The index of the item to move.
 * @returns The array with the item moved to the first index.
 */
export function moveToFirstIndex<ItemT>(arr: ItemT[], index: number): ItemT[] {
  if (index <= 0) {
    throw new Error(`Index ${index} not inbounds, must be great =>0`);
  }

  const [item] = arr.splice(index, 1);
  if (item) {
    arr.unshift(item);
  }
  return arr;
}

/**
 * Sync the account `Selector` component props with user attenuation by moving the selected account to the first option in the accounts to choose from.
 *
 * Note: The `Selector` component will set the first item in options(i.e., accountsToSelect) as the default selected option in the interactive UI state.
 * If the user has already chosen an account, we want that to reflect on the UI. Doing so will sync with the permission request iterator item with UI interactions.
 *
 * @param accountsToSelect - The accounts to select.
 * @param curr - The current permission request iterator item that holds the user account selection attenuation.
 * @returns An array of accounts with the selected account at the first index or the original array if the user has not selected an account for the permission.
 */
export function updateAccountsOrder(
  accountsToSelect: Address[],
  curr: PermissionRequestIteratorItem | null,
): Address[] {
  const accountsUpdated = Array.from(accountsToSelect);
  if (curr) {
    const selectedAccount = curr.permissionRequest.account;

    if (selectedAccount) {
      const index = accountsUpdated.findIndex(
        (account) => account.toLowerCase() === selectedAccount.toLowerCase(),
      );
      return index === 0
        ? accountsUpdated
        : moveToFirstIndex<Hex>(accountsUpdated, index);
    }
  }
  return accountsUpdated;
}
