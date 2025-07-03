import { describe, it, beforeEach } from '@jest/globals';
import { createMockSnapsProvider } from '@metamask/7715-permissions-shared/testing';
import type { Delegation } from '@metamask/delegation-core';
import {
  getDeleGatorEnvironment,
  ROOT_AUTHORITY,
} from '@metamask/delegation-toolkit';
import { isHexString } from '@metamask/utils';

import { SmartAccountController } from '../../src/accountController/smartAccountController';

describe('SmartAccountController', () => {
  const entropy =
    '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  // constant derived via delegator-core-viem
  const expectedAddress = '0x70cCc6AF705a54bd31cD9426aF0a2A0B2E4Dfa2D';
  const expectedBalance = '0x1000000000000000000';
  let accountController: SmartAccountController;
  const mockSnapsProvider = createMockSnapsProvider();

  beforeEach(() => {
    mockSnapsProvider.request.mockReset();
    mockSnapsProvider.request.mockImplementation(async (req) => {
      const { method, params } = req;

      switch (method as string) {
        case 'snap_getEntropy':
          return entropy;
        case 'snap_experimentalProviderRequest': {
          const {
            request: { method: internalMethod },
          } = params as {
            request: { method: string };
          };

          if (internalMethod === 'eth_getBalance') {
            return expectedBalance;
          } else if (internalMethod === 'eth_getCode') {
            return '0x';
          }
          break;
        }
        default:
          break;
      }

      return null;
    });

    accountController = new SmartAccountController({
      snapsProvider: mockSnapsProvider,
      supportedChains: [11155111],
      deploymentSalt: '0x1234',
    });
  });

  describe('constructor()', () => {
    it('should throw if no supported chains are specified', () => {
      expect(
        () =>
          new SmartAccountController({
            snapsProvider: mockSnapsProvider,
            supportedChains: [],
            deploymentSalt: '0x1234',
          }),
      ).toThrow('No supported chains specified');
    });

    it('should throw if an unsupported chain is specified', () => {
      expect(
        () =>
          new SmartAccountController({
            snapsProvider: mockSnapsProvider,
            supportedChains: [123456] as any,
            deploymentSalt: '0x1234',
          }),
      ).toThrow('Unsupported chains specified: 123456');
    });
  });

  describe('getAccountAddress()', () => {
    it('should get the account address', async () => {
      mockSnapsProvider.request.mockResolvedValueOnce(entropy);

      const address = await accountController.getAccountAddress({
        chainId: 11155111,
      });

      expect(address).toStrictEqual(expectedAddress);
    });

    it('should reject if an invalid chainId is supplied', async () => {
      const invalidChainId = 12345;

      await expect(
        accountController.getAccountAddress({
          chainId: invalidChainId,
        }),
      ).rejects.toThrow(`Unsupported ChainId: ${invalidChainId}`);
    });

    it('should accept one of multiple accepted chains', async () => {
      const controller = new SmartAccountController({
        snapsProvider: mockSnapsProvider,
        deploymentSalt: '0x1234',
        supportedChains: [11155111],
      });

      const address = await controller.getAccountAddress({
        chainId: 11155111,
      });

      expect(address).toBeDefined();
    });
  });

  describe('getAccountMetadata()', () => {
    it('should get the account metadata', async () => {
      const environment = getDeleGatorEnvironment(11155111);

      const metadata = await accountController.getAccountMetadata({
        chainId: 11155111,
      });

      expect(metadata.factory).toStrictEqual(environment.SimpleFactory);
      expect(isHexString(metadata.factoryData)).toBe(true);
    });

    it('should reject if an invalid chainId is supplied', async () => {
      const invalidChainId = 12345;

      await expect(
        accountController.getAccountMetadata({
          chainId: invalidChainId,
        }),
      ).rejects.toThrow(`Unsupported ChainId: ${invalidChainId}`);
    });
  });

  describe('signDelegation()', () => {
    const unsignedDelegation: Omit<Delegation, 'signature'> = {
      delegate: '0x1234567890abcdef1234567890abcdef12345678',
      delegator: '0x1234567890abcdef1234567890abcdef12345678',
      caveats: [],
      salt: 0n,
      authority: ROOT_AUTHORITY,
    };

    it('should sign a delegation', async () => {
      const signedDelegation = await accountController.signDelegation({
        chainId: 11155111,
        delegation: unsignedDelegation,
      });

      expect(signedDelegation).toStrictEqual({
        ...unsignedDelegation,
        signature: expect.any(String),
      });

      expect(isHexString(signedDelegation.signature)).toBe(true);

      const EXPECTED_EOA_SIGNATURE_STRING_LENGTH = 65 * 2 + 2;
      expect(signedDelegation.signature).toHaveLength(
        EXPECTED_EOA_SIGNATURE_STRING_LENGTH,
      );
    });

    it('should reject if an invalid chainId is supplied', async () => {
      const invalidChainId = 12345;

      await expect(
        accountController.signDelegation({
          chainId: invalidChainId,
          delegation: unsignedDelegation,
        }),
      ).rejects.toThrow(`Unsupported ChainId: ${invalidChainId}`);
    });
  });
});
