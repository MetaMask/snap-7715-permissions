import type { PermissionOffer } from '@metamask/7715-permissions-shared/types';

/**
 * The default permission offers that the Gator snap will offer to the kernel snap
 */
export const DEFAULT_GATOR_PERMISSION_TO_OFFER: PermissionOffer[] = [
  {
    type: 'native-token-stream',
    proposedName: 'Native Token Stream',
  },
  {
    type: 'native-token-periodic',
    proposedName: 'Native Token Periodic Transfer',
  },
  {
    type: 'erc20-token-stream',
    proposedName: 'ERC20 Token Stream',
  },
];
