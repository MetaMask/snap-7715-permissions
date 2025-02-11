import { HDNodeWallet, Mnemonic } from 'ethers';
import type { Address, Hex, PrivateKeyAccount } from 'viem';
import { createPublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

import type { PermissionRequestIteratorItem } from '../iterator';
import { snapTansport } from './provider';

/**
 * Creates a mnemonic from the entropy and derives a private key and address from the mnemonic and path.
 *
 * @param entropyFn - The entropy function to derive the mnemonic from.
 * @param path - The path to derive the private key from.
 * @returns The private key and address derived from the entropy and path.
 */
export const getKeyPair = async (
  entropyFn: () => Promise<string>,
  path: string,
): Promise<[PrivateKeyAccount, Hex]> => {
  const entropy = await entropyFn();
  const mnemonic = Mnemonic.fromEntropy(entropy);
  const childWallet = HDNodeWallet.fromMnemonic(mnemonic, path);

  const privateKey = childWallet.privateKey.toString() as Hex;
  return [
    privateKeyToAccount(childWallet.privateKey.toString() as Hex),
    privateKey,
  ];
};

/**
 * Determines whether the given CAIP-2 chain ID represents an EVM-based chain.
 *
 * @param chain - The CAIP-2 chain ID to check.
 * @returns Returns true if the chain is EVM-based, otherwise false.
 */
export function isEvmChain(chain: string): boolean {
  return chain.startsWith('eip155:');
}

/**
 * Throws an error with the specified message.
 *
 * @param message - The error message.
 */
export function throwError(message: string): never {
  throw new Error(message);
}

/**
 * Gets the chain ID of the current network.
 *
 * @returns The chain ID of the current network.
 */
export const getChainId = async (): Promise<number> => {
  const client = createPublicClient({
    transport: snapTansport,
  });

  return await client.getChainId();
};

/**
 * Determines whether the provided address is deployed on the network.
 *
 * @param address - The address to check.
 * @returns Returns true if the account is deployed, otherwise false.
 */
export const isAccountDeployed = async (address: Hex): Promise<boolean> => {
  const client = createPublicClient({
    transport: snapTansport,
  });

  const code = await client.getCode({ address });
  return code !== '0x';
};

/**
 * Validates whether there are no duplicate addresses in the set of addresses.
 *
 * @param addressToCheck - The address to check.
 * @param setOfAddresses - An array of addresses to check against.
 * @returns Returns true if the address is unique, otherwise false.
 */
export function isUniqueAddress(
  addressToCheck: Hex,
  setOfAddresses: Hex[],
): boolean {
  return !setOfAddresses.find(
    (addressInSet) => addressInSet === addressToCheck,
  );
}

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
