import { describe, it, beforeEach } from '@jest/globals';
import {
  createRootDelegation,
  getDeleGatorEnvironment,
} from '@metamask-private/delegator-core-viem';
import type { SnapsProvider } from '@metamask/snaps-sdk';
import { isHex, size } from 'viem';
import { sepolia, oneWorld } from 'viem/chains';

import { AccountController } from '../src/accountController';

describe('AccountController', () => {
  const entropy =
    '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  // constant derived via delegator-core-viem
  const expectedAddress = '0xD1feB94b097Bd806a67F16c7b549f7e894C0a546';
  const expectedBalance = '0x1000000000000000000';
  let accountController: AccountController;
  const mockSnapsProvider = {
    request: jest.fn(),
  } as unknown as jest.Mocked<SnapsProvider>;

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

    accountController = new AccountController({
      snapsProvider: mockSnapsProvider,
      supportedChains: [sepolia],
      deploymentSalt: '0x1234',
    });
  });

  describe('constructor()', () => {
    it('should throw if no supported chains are specified', () => {
      expect(
        () =>
          new AccountController({
            snapsProvider: mockSnapsProvider,
            supportedChains: [],
            deploymentSalt: '0x1234',
          }),
      ).toThrow('No supported chains specified');
    });

    it('should throw if an unsupported chain is specified', () => {
      expect(
        () =>
          new AccountController({
            snapsProvider: mockSnapsProvider,
            supportedChains: [oneWorld] as any,
            deploymentSalt: '0x1234',
          }),
      ).toThrow('Unsupported chains specified: oneworld');
    });

    it('should not throw if supported chains are not specified', () => {
      expect(
        () =>
          new AccountController({
            snapsProvider: mockSnapsProvider,
            deploymentSalt: '0x1234',
          }),
      ).not.toThrow();
    });
  });

  describe('getDelegationManager()', () => {
    it('should get the delegation manager', async () => {
      const chainId = sepolia.id;
      const { DelegationManager: expectedDelegationManager } =
        getDeleGatorEnvironment(chainId);

      const delegationManager = await accountController.getDelegationManager({
        chainId,
      });

      expect(delegationManager).toStrictEqual(expectedDelegationManager);
    });

    it('should reject if an invalid chainId is supplied', async () => {
      const invalidChainId = 12345;

      await expect(
        accountController.getDelegationManager({
          chainId: invalidChainId,
        }),
      ).rejects.toThrow(`Unsupported ChainId: ${invalidChainId}`);
    });
  });

  describe('getAccountAddress()', () => {
    it('should get the account address', async () => {
      mockSnapsProvider.request.mockResolvedValueOnce(entropy);

      const address = await accountController.getAccountAddress({
        chainId: sepolia.id,
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
  });

  describe('getAccountMetadata()', () => {
    it('should get the account metadata', async () => {
      const environment = getDeleGatorEnvironment(sepolia.id);

      const metadata = await accountController.getAccountMetadata({
        chainId: sepolia.id,
      });

      expect(metadata.factory).toStrictEqual(environment.SimpleFactory);
      expect(isHex(metadata.factoryData)).toBe(true);
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

  describe('getAccountBalance()', () => {
    it('should get the account balance', async () => {
      const balance = await accountController.getAccountBalance({
        chainId: sepolia.id,
      });

      expect(balance).toStrictEqual(expectedBalance);
    });

    it('should reject if an invalid chainId is supplied', async () => {
      const invalidChainId = 12345;

      await expect(
        accountController.getAccountBalance({
          chainId: invalidChainId,
        }),
      ).rejects.toThrow(`Unsupported ChainId: ${invalidChainId}`);
    });
  });

  describe('signDelegation()', () => {
    const unsignedDelegation = createRootDelegation(
      '0x1234567890abcdef1234567890abcdef12345678',
      '0x1234567890abcdef1234567890abcdef12345678',
      [],
    );

    it('should sign a delegation', async () => {
      const signedDelegation = await accountController.signDelegation({
        chainId: sepolia.id,
        delegation: unsignedDelegation,
      });

      expect(signedDelegation).toStrictEqual({
        ...unsignedDelegation,
        signature: expect.any(String),
      });

      expect(isHex(signedDelegation.signature)).toBe(true);

      const EXPECTED_EOA_SIGNATURE_LENGTH = 65;
      expect(size(signedDelegation.signature)).toBe(
        EXPECTED_EOA_SIGNATURE_LENGTH,
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
