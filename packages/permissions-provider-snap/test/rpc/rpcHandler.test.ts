import { describe, expect, beforeEach, it, jest } from '@jest/globals';

import type { AccountControllerInterface } from '../../src/core/accountController';
import type { PermissionsContextBuilder } from '../../src/permissions';
import { createRpcHandler, type RpcHandler } from '../../src/rpc/rpcHandler';
import type { TokenPricesService } from '../../src/services';
import type { PermissionConfirmationRenderHandler } from '../../src/confirmation';
import { UserEventDispatcher } from '../../src/core/userEventDispatcher';

jest.mock('../../src/userEventDispatcher');

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
  const mockUserEventDispatcher = new UserEventDispatcher();

  (mockUserEventDispatcher.off as jest.Mock).mockImplementation(
    () => mockUserEventDispatcher,
  );

  beforeEach(() => {
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
      userEventDispatcher: mockUserEventDispatcher,
    });
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });
});
