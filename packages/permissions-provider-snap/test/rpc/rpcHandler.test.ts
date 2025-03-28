import { describe, expect, beforeEach, it, jest } from '@jest/globals';
import { createMockSnapsProvider } from '@metamask/7715-permissions-shared/testing';

import type { AccountControllerInterface } from '../../src/accountController';
import type { PermissionsContextBuilder } from '../../src/orchestrators';
import { createRpcHandler, type RpcHandler } from '../../src/rpc/rpcHandler';
import type { TokenPricesService } from '../../src/services';
import type { PermissionConfirmationRenderHandler } from '../../src/ui';

describe('RpcHandler', () => {
  let handler: RpcHandler;
  const mockAccountController: jest.Mocked<AccountControllerInterface> = {
    getAccountAddress: jest.fn(),
    signDelegation: jest.fn(),
    getAccountMetadata: jest.fn(),
    getAccountBalance: jest.fn(),
    getDelegationManager: jest.fn(),
    getEnvironment: jest.fn(),
  };
  const mockPermissionConfirmationRenderHandler = {
    createConfirmationDialog: jest.fn(),
  } as jest.Mocked<PermissionConfirmationRenderHandler>;
  const mockPermissionsContextBuilder = {
    buildPermissionsContext: jest.fn(),
  } as jest.Mocked<PermissionsContextBuilder>;
  const mockTokenPricesService = {
    getCryptoToFiatConversion: jest.fn(),
  } as unknown as jest.Mocked<TokenPricesService>;
  const mockSnapsProvider = createMockSnapsProvider();

  beforeEach(() => {
    mockSnapsProvider.request.mockClear();
    mockAccountController.getAccountAddress.mockClear();
    mockAccountController.signDelegation.mockClear();
    mockAccountController.getAccountMetadata.mockClear();
    mockAccountController.getAccountBalance.mockClear();

    handler = createRpcHandler({
      accountController: mockAccountController,
      permissionConfirmationRenderHandler:
        mockPermissionConfirmationRenderHandler,
      permissionsContextBuilder: mockPermissionsContextBuilder,
      tokenPricesService: mockTokenPricesService,
    });
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });
});
