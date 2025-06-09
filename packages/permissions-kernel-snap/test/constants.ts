import type { PermissionsRequest } from '@metamask/7715-permissions-shared/types';

export const MOCK_PERMISSIONS_REQUEST_SINGLE: PermissionsRequest = [
  {
    chainId: '0x1',
    expiry: 1,
    signer: {
      type: 'account',
      data: {
        address: '0x016562aA41A8697720ce0943F003141f5dEAe006',
      },
    },
    permission: {
      type: 'native-token-transfer',
      data: {
        justification: 'shh...permission 1',
        allowance: '0x1DCD6500',
      },
    },
  },
];

export const MOCK_PERMISSIONS_REQUEST_MULTIPLE: PermissionsRequest = [
  {
    chainId: '0x1',
    expiry: 1,
    signer: {
      type: 'account',
      data: {
        address: '0x016562aA41A8697720ce0943F003141f5dEAe006',
      },
    },
    permission: {
      type: 'native-token-transfer',
      data: {
        justification: 'shh...permission 1',
        allowance: '0x1DCD6500',
      },
    },
  },
  {
    chainId: '0x1',
    expiry: 1,
    signer: {
      type: 'account',
      data: {
        address: '0x016562aA41A8697720ce0943F003141f5dEAe006',
      },
    },
    permission: {
      type: 'erc20-token-transfer',
      data: {
        justification: 'shh...permission 2',
        address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
        allowance: '0x1DCD6500',
      },
    },
  },
];

export const MOCK_PERMISSIONS_REQUEST_NON_SUPPORTED: PermissionsRequest = [
  {
    chainId: '0x1',
    expiry: 1,
    signer: {
      type: 'account',
      data: {
        address: '0x016562aA41A8697720ce0943F003141f5dEAe006',
      },
    },
    permission: {
      type: 'non-supported-permission-type',
      data: {
        justification: 'shh...permission 1',
        allowance: '0x1DCD6500',
      },
    },
  },
];
