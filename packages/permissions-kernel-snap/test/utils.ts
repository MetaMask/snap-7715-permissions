import type { KernelState } from '../src/stateManagement';

export const TEST_CASE_SNAP_HOST_ID = 'local:http://localhost:8081';

export const TEST_CASE_DEFAULT_STATE: KernelState = {
  permissionOfferRegistry: {
    [TEST_CASE_SNAP_HOST_ID]: [
      {
        type: 'native-token-transfer',
        hostId: TEST_CASE_SNAP_HOST_ID,
        hostPermissionId:
          'd323523d13f344ed84977a720093e2b5c199565fa872ca9d1fbcfc4317c8ef11',
        proposedName: 'Native Token Transfer',
      },
      {
        type: 'erc20-token-transfer',
        hostId: TEST_CASE_SNAP_HOST_ID,
        hostPermissionId:
          '852237130faa4e9c5938a02b52d02f41db0afe58267d9872f12a5047dd918df4',
        proposedName: 'ERC20 Token Transfer',
      },
    ],
  },
};
