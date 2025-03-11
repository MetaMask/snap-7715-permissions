import { expect } from '@jest/globals';
import { createMockSnapsProvider } from '@metamask/7715-permissions-shared/testing';
import type { RegisteredPermissionOffer } from '@metamask/7715-permissions-shared/types';

import type { KernelState } from '../src/stateManagement';
import { createStateManager } from '../src/stateManagement';
import {
  TEST_CASE_DEFAULT_STATE,
  TEST_CASE_PERMISSION_PROVIDER_SNAP_ID,
} from './constants';

describe('KernelStateManager', () => {
  const stateManager = createStateManager();
  const mockSnapsProvider = createMockSnapsProvider();

  // @ts-expect-error Mocking Snap global object
  // eslint-disable-next-line no-restricted-globals
  global.snap = mockSnapsProvider;

  beforeEach(() => {
    mockSnapsProvider.request.mockClear();
  });

  describe('getState', () => {
    it('should return the default state when no state is retrieved', async () => {
      mockSnapsProvider.request.mockResolvedValue(null);

      const result = await stateManager.getState();
      expect(mockSnapsProvider.request).toHaveBeenCalledWith({
        method: 'snap_manageState',
        params: {
          operation: 'get',
          encrypted: true,
        },
      });
      expect(result).toStrictEqual(TEST_CASE_DEFAULT_STATE);
    });

    it('should return stored permissions offer registry', async () => {
      mockSnapsProvider.request.mockResolvedValue(TEST_CASE_DEFAULT_STATE);

      const { permissionOfferRegistry } = await stateManager.getState();
      expect(mockSnapsProvider.request).toHaveBeenCalledWith({
        method: 'snap_manageState',
        params: {
          operation: 'get',
          encrypted: true,
        },
      });
      expect(permissionOfferRegistry).toStrictEqual(
        TEST_CASE_DEFAULT_STATE.permissionOfferRegistry,
      );
    });

    it('throw Error if the operation fails when attempting to get state', async () => {
      mockSnapsProvider.request.mockRejectedValue(
        new Error('Failed to get state'),
      );

      await expect(stateManager.getState()).rejects.toThrow(
        'Failed to get state',
      );
    });
  });

  describe('setState', () => {
    it('should update offers on permissions offer registry', async () => {
      mockSnapsProvider.request.mockResolvedValue(TEST_CASE_DEFAULT_STATE);
      const state = await stateManager.getState();
      expect(snap.request).toHaveBeenCalledWith({
        method: 'snap_manageState',
        params: {
          operation: 'get',
          encrypted: true,
        },
      });
      expect(state).toStrictEqual(TEST_CASE_DEFAULT_STATE);

      // Store a new permission offer for the host TEST_CASE_PERMISSION_PROVIDER_SNAP_ID
      const hostStoredOffers =
        TEST_CASE_DEFAULT_STATE.permissionOfferRegistry[
          TEST_CASE_PERMISSION_PROVIDER_SNAP_ID
        ] ?? [];
      const offerToStore: RegisteredPermissionOffer = {
        type: 'erc1155-token-transfer',
        hostId: TEST_CASE_PERMISSION_PROVIDER_SNAP_ID,
        hostPermissionId: '0x3344',
        proposedName: 'ERC1155 Token Transfer',
      };
      const updatedState: KernelState = {
        ...state,
        permissionOfferRegistry: {
          [TEST_CASE_PERMISSION_PROVIDER_SNAP_ID]: [
            ...hostStoredOffers,
            offerToStore,
          ],
        },
      };
      await stateManager.setState(updatedState);

      // Check if the state was updated
      expect(snap.request).toHaveBeenCalledWith({
        method: 'snap_manageState',
        params: {
          operation: 'update',
          newState: expect.objectContaining(updatedState),
          encrypted: true,
        },
      });
    });

    it('throw Error if the operation fails when attempting to update state', async () => {
      mockSnapsProvider.request.mockRejectedValue(
        new Error('Failed to update state'),
      );

      const hostStoredOffers =
        TEST_CASE_DEFAULT_STATE.permissionOfferRegistry[
          TEST_CASE_PERMISSION_PROVIDER_SNAP_ID
        ] ?? [];
      const offerToStore: RegisteredPermissionOffer = {
        type: 'erc1155-token-transfer',
        hostId: TEST_CASE_PERMISSION_PROVIDER_SNAP_ID,
        hostPermissionId: '0x3344',
        proposedName: 'ERC1155 Token Transfer',
      };
      const updatedState: KernelState = {
        permissionOfferRegistry: {
          [TEST_CASE_PERMISSION_PROVIDER_SNAP_ID]: [
            ...hostStoredOffers,
            offerToStore,
          ],
        },
      };

      await expect(stateManager.setState(updatedState)).rejects.toThrow(
        'Failed to set state',
      );
    });
  });
});
