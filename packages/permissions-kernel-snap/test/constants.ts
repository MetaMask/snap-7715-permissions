import type { PermissionsRequest } from '@metamask/7715-permissions-shared/types';

import type { KernelState } from '../src/stateManagement';

export const TEST_CASE_PERMISSION_PROVIDER_SNAP_ID =
  // eslint-disable-next-line no-restricted-globals
  process.env.SNAP_ENV === 'production'
    ? 'npm:@metamask/7715-permissions-provider'
    : 'local:http://localhost:8081';

export const TEST_CASE_DEFAULT_STATE: KernelState = {
  permissionOfferRegistry: {
    [TEST_CASE_PERMISSION_PROVIDER_SNAP_ID]: [
      {
        type: 'native-token-stream',
        hostId: TEST_CASE_PERMISSION_PROVIDER_SNAP_ID,
        hostPermissionId:
          '8c1697dd46c1e0be7a1627f8efb110612b9ee8510476d78da0f74687afbe0b10',
        proposedName: 'Native Token Stream',
      },
    ],
  },
};

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
    permissions: [
      {
        type: 'native-token-transfer',
        data: {
          justification: 'shh...permission 1',
          allowance: '0x1DCD6500',
        },
      },
    ],
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
    permissions: [
      {
        type: 'native-token-transfer',
        data: {
          justification: 'shh...permission 1',
          allowance: '0x1DCD6500',
        },
      },
    ],
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
    permissions: [
      {
        type: 'erc20-token-transfer',
        data: {
          justification: 'shh...permission 2',
          address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
          allowance: '0x1DCD6500',
        },
      },
    ],
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
    permissions: [
      {
        type: 'non-supported-permission-type',
        data: {
          justification: 'shh...permission 1',
          allowance: '0x1DCD6500',
        },
      },
    ],
  },
];
