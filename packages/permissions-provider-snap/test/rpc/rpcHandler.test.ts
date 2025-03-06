import { describe, expect, beforeEach, it, jest } from '@jest/globals';
import { createMockSnapsProvider } from '@metamask/7715-permissions-shared/testing';

import type { AccountControllerInterface } from '../../src/accountController';
import { createRpcHandler, type RpcHandler } from '../../src/rpc/rpcHandler';

describe('RpcHandler', () => {
  let handler: RpcHandler;
  const mockAccountController: jest.Mocked<AccountControllerInterface> = {
    getAccountAddress: jest.fn(),
    signDelegation: jest.fn(),
    getAccountMetadata: jest.fn(),
    getAccountBalance: jest.fn(),
    getDelegationManager: jest.fn(),
  };
  const mockSnapsProvider = createMockSnapsProvider();

  beforeEach(() => {
    mockSnapsProvider.request.mockClear();
    mockAccountController.getAccountAddress.mockClear();
    mockAccountController.signDelegation.mockClear();
    mockAccountController.getAccountMetadata.mockClear();
    mockAccountController.getAccountBalance.mockClear();

    handler = createRpcHandler({
      accountController: mockAccountController,
      snapsProvider: mockSnapsProvider,
    });
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });
});
