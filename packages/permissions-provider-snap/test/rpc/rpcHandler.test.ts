import { describe, expect, beforeEach, it, jest } from '@jest/globals';
import { RpcHandler } from '../../src/rpc/rpcHandler';
import type { SnapsProvider } from '@metamask/snaps-sdk';
import {
  createMockSnapsProvider,
  Logger,
} from '@metamask/7715-permissions-shared';

describe('RpcHandler', () => {
  let handler: RpcHandler;
  let mockSnapsProvider: jest.Mocked<SnapsProvider>;
  let mockAccountController: jest.Mocked<{}>;
  // todo: mock the logger
  const logger: Logger = new Logger();

  beforeEach(() => {
    mockSnapsProvider = createMockSnapsProvider() as jest.Mocked<SnapsProvider>;

    mockAccountController = {};

    handler = new RpcHandler({
      snapsProvider: mockSnapsProvider,
      accountController: mockAccountController,
      logger,
    });
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should pong', async () => {
    const result = await handler.ping();

    expect(result).toBe('pong');
  });
});
