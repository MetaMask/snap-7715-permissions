import { createMockSnapsProvider } from '@metamask/7715-permissions-shared/testing';
import { Text } from '@metamask/snaps-sdk/jsx';

import { DialogInterface } from '../../src/core/dialogInterface';

describe('DialogInterface', () => {
  const mockSnapsProvider = createMockSnapsProvider();
  let dialogInterface: DialogInterface;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSnapsProvider.request.mockReset();
    dialogInterface = new DialogInterface(mockSnapsProvider);
  });

  describe('show', () => {
    const mockInterfaceId = 'test-interface-123';
    const testUi = <Text>Test content</Text>;

    it('should create interface on first call', async () => {
      mockSnapsProvider.request.mockImplementation(async (params: any) => {
        if (params.method === 'snap_createInterface') {
          return mockInterfaceId;
        }
        if (params.method === 'snap_dialog') {
          return new Promise(() => {
            // Dialog stays open
          });
        }
        return null;
      });

      const result = await dialogInterface.show(testUi);

      expect(result).toBe(mockInterfaceId);
      expect(mockSnapsProvider.request).toHaveBeenCalledWith({
        method: 'snap_createInterface',
        params: {
          ui: testUi,
          context: {},
        },
      });
      expect(mockSnapsProvider.request).toHaveBeenCalledWith({
        method: 'snap_dialog',
        params: {
          id: mockInterfaceId,
        },
      });
    });

    it('should update interface on subsequent calls', async () => {
      mockSnapsProvider.request.mockImplementation(async (params: any) => {
        if (params.method === 'snap_createInterface') {
          return mockInterfaceId;
        }
        if (params.method === 'snap_dialog') {
          return new Promise(() => {
            // Dialog stays open
          });
        }
        if (params.method === 'snap_updateInterface') {
          return null;
        }
        return null;
      });

      // First call creates interface
      await dialogInterface.show(testUi);

      // Second call should update
      const newUi = <Text>Updated content</Text>;
      await dialogInterface.show(newUi);

      expect(mockSnapsProvider.request).toHaveBeenCalledWith({
        method: 'snap_updateInterface',
        params: {
          id: mockInterfaceId,
          ui: newUi,
          context: {},
        },
      });
    });

    it('should only show dialog once', async () => {
      mockSnapsProvider.request.mockImplementation(async (params: any) => {
        if (params.method === 'snap_createInterface') {
          return mockInterfaceId;
        }
        if (params.method === 'snap_dialog') {
          return new Promise(() => {
            // Dialog stays open
          });
        }
        if (params.method === 'snap_updateInterface') {
          return null;
        }
        return null;
      });

      // First call creates interface and shows dialog
      await dialogInterface.show(testUi);

      // Second call should update but not show dialog again
      await dialogInterface.show(<Text>Updated</Text>);

      // snap_dialog should only be called once
      const dialogCalls = mockSnapsProvider.request.mock.calls.filter(
        (call) => call[0].method === 'snap_dialog',
      );
      expect(dialogCalls).toHaveLength(1);
    });

    it('should register close handler', async () => {
      const onClose = jest.fn();

      let dialogResolve: (value: null) => void = () => {};

      mockSnapsProvider.request.mockImplementation(async (params: any) => {
        if (params.method === 'snap_createInterface') {
          return mockInterfaceId;
        }
        if (params.method === 'snap_dialog') {
          return new Promise((resolve) => {
            dialogResolve = resolve;
          });
        }
        return null;
      });

      await dialogInterface.show(testUi, onClose);

      // Simulate dialog close (returns null when user clicks X)
      dialogResolve(null);

      // Wait for async handler
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(onClose).toHaveBeenCalled();
    });

    it('should replace close handler on subsequent calls with handler', async () => {
      const onClose1 = jest.fn();
      const onClose2 = jest.fn();

      let dialogResolve: (value: null) => void = () => {};

      mockSnapsProvider.request.mockImplementation(async (params: any) => {
        if (params.method === 'snap_createInterface') {
          return mockInterfaceId;
        }
        if (params.method === 'snap_dialog') {
          return new Promise((resolve) => {
            dialogResolve = resolve;
          });
        }
        if (params.method === 'snap_updateInterface') {
          return null;
        }
        return null;
      });

      await dialogInterface.show(testUi, onClose1);
      await dialogInterface.show(<Text>Updated</Text>, onClose2);

      // Simulate dialog close
      dialogResolve(null);

      // Wait for async handler
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Only the latest handler should be called
      expect(onClose1).not.toHaveBeenCalled();
      expect(onClose2).toHaveBeenCalled();
    });

    it('should keep existing close handler when subsequent call has no handler', async () => {
      const onClose = jest.fn();

      let dialogResolve: (value: null) => void = () => {};

      mockSnapsProvider.request.mockImplementation(async (params: any) => {
        if (params.method === 'snap_createInterface') {
          return mockInterfaceId;
        }
        if (params.method === 'snap_dialog') {
          return new Promise((resolve) => {
            dialogResolve = resolve;
          });
        }
        if (params.method === 'snap_updateInterface') {
          return null;
        }
        return null;
      });

      await dialogInterface.show(testUi, onClose);
      await dialogInterface.show(<Text>Updated</Text>); // No handler

      // Simulate dialog close
      dialogResolve(null);

      // Wait for async handler
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Original handler should still be called
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('close', () => {
    const mockInterfaceId = 'test-interface-123';

    it('should resolve the interface', async () => {
      mockSnapsProvider.request.mockImplementation(async (params: any) => {
        if (params.method === 'snap_createInterface') {
          return mockInterfaceId;
        }
        if (params.method === 'snap_dialog') {
          return new Promise(() => {});
        }
        if (params.method === 'snap_resolveInterface') {
          return null;
        }
        return null;
      });

      await dialogInterface.show(<Text>Test</Text>);
      await dialogInterface.close();

      expect(mockSnapsProvider.request).toHaveBeenCalledWith({
        method: 'snap_resolveInterface',
        params: {
          id: mockInterfaceId,
          value: {},
        },
      });
    });

    it('should be safe to call when no interface exists', async () => {
      await expect(dialogInterface.close()).resolves.not.toThrow();
    });

    it('should silently ignore errors when closing', async () => {
      mockSnapsProvider.request.mockImplementation(async (params: any) => {
        if (params.method === 'snap_createInterface') {
          return mockInterfaceId;
        }
        if (params.method === 'snap_dialog') {
          return new Promise(() => {});
        }
        if (params.method === 'snap_resolveInterface') {
          throw new Error('Already resolved');
        }
        return null;
      });

      await dialogInterface.show(<Text>Test</Text>);
      await expect(dialogInterface.close()).resolves.not.toThrow();
    });
  });

  describe('interfaceId', () => {
    it('should return undefined before show is called', () => {
      expect(dialogInterface.interfaceId).toBeUndefined();
    });

    it('should return the interface ID after show is called', async () => {
      const mockInterfaceId = 'test-interface-123';
      mockSnapsProvider.request.mockImplementation(async (params: any) => {
        if (params.method === 'snap_createInterface') {
          return mockInterfaceId;
        }
        if (params.method === 'snap_dialog') {
          return new Promise(() => {});
        }
        return null;
      });

      await dialogInterface.show(<Text>Test</Text>);

      expect(dialogInterface.interfaceId).toBe(mockInterfaceId);
    });
  });
});
