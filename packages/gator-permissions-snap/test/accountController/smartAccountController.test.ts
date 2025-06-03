import { describe, it, beforeEach } from '@jest/globals';
import { createMockSnapsProvider } from '@metamask/7715-permissions-shared/testing';
import {
  createDelegation,
  getDeleGatorEnvironment,
} from '@metamask/delegation-toolkit';
import type { AccountApiClient } from 'src/clients/accountApiClient';
import type { TokenMetadataClient } from 'src/core/types';
import { isHex, parseUnits, size } from 'viem';
import { sepolia, oneWorld, lineaSepolia } from 'viem/chains';

import { SmartAccountController } from '../../src/accountController';

describe('SmartAccountController', () => {
  const entropy =
    '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  // constant derived via delegator-core-viem
  const expectedAddress = '0x70cCc6AF705a54bd31cD9426aF0a2A0B2E4Dfa2D';
  const expectedBalance = '0x1000000000000000000';
  let accountController: SmartAccountController;
  let mockTokenMetadataClient: jest.Mocked<TokenMetadataClient>;
  let mockAccountApiClient: jest.Mocked<AccountApiClient>;
  const mockSnapsProvider = createMockSnapsProvider();

  beforeEach(() => {
    mockTokenMetadataClient = {
      getTokenBalanceAndMetadata: jest.fn(() => ({
        balance: parseUnits('10', 18),
        symbol: 'ETH',
        decimals: 18,
      })),
    } as unknown as jest.Mocked<TokenMetadataClient>;

    mockAccountApiClient = {
      isChainIdSupported: jest.fn(() => true),
      getTokenBalanceAndMetadata: jest.fn(() => ({
        balance: parseUnits('10', 18),
        symbol: 'ETH',
        decimals: 18,
      })),
    } as unknown as jest.Mocked<AccountApiClient>;

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
      supportedChains: [sepolia],
      deploymentSalt: '0x1234',
      tokenMetadataClient: mockTokenMetadataClient,
      accountApiClient: mockAccountApiClient,
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
            tokenMetadataClient: mockTokenMetadataClient,
            accountApiClient: mockAccountApiClient,
          }),
      ).toThrow('No supported chains specified');
    });

    it('should throw if an unsupported chain is specified', () => {
      expect(
        () =>
          new SmartAccountController({
            snapsProvider: mockSnapsProvider,
            supportedChains: [oneWorld] as any,
            deploymentSalt: '0x1234',
            tokenMetadataClient: mockTokenMetadataClient,
            accountApiClient: mockAccountApiClient,
          }),
      ).toThrow('Unsupported chains specified: oneworld');
    });

    it('should not throw if supported chains are not specified', () => {
      expect(
        () =>
          new SmartAccountController({
            snapsProvider: mockSnapsProvider,
            deploymentSalt: '0x1234',
            tokenMetadataClient: mockTokenMetadataClient,
            accountApiClient: mockAccountApiClient,
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

    it('should accept one of multiple accepted chains', async () => {
      const controller = new SmartAccountController({
        snapsProvider: mockSnapsProvider,
        deploymentSalt: '0x1234',
        supportedChains: [sepolia, lineaSepolia],
        tokenMetadataClient: mockTokenMetadataClient,
        accountApiClient: mockAccountApiClient,
      });

      const address = await controller.getAccountAddress({
        chainId: sepolia.id,
      });

      expect(address).toBeDefined();
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

  describe('getTokenBalanceAndMetadata()', () => {
    it('should get the account balance, decimals and symbol', async () => {
      const { balance, decimals, symbol } =
        await accountController.getTokenBalanceAndMetadata({
          chainId: sepolia.id,
        });

      expect(balance).toStrictEqual(parseUnits('10', 18));
      expect(decimals).toBe(18);
      expect(symbol).toBe('ETH');
    });

    it('should reject if an invalid chainId is supplied', async () => {
      const invalidChainId = 12345;

      await expect(
        accountController.getTokenBalanceAndMetadata({
          chainId: invalidChainId,
        }),
      ).rejects.toThrow(`Unsupported ChainId: ${invalidChainId}`);
    });
  });

  describe('signDelegation()', () => {
    const unsignedDelegation = createDelegation({
      to: '0x1234567890abcdef1234567890abcdef12345678',
      from: '0x1234567890abcdef1234567890abcdef12345678',
      caveats: [],
    });

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

  describe('getEnvironment()', () => {
    it('should get the DeleGator Environment for the current account', async () => {
      const chainId = sepolia.id;
      const expectedDeleGatorEnvironment = getDeleGatorEnvironment(sepolia.id);

      const environment = await accountController.getEnvironment({
        chainId,
      });

      expect(environment).toStrictEqual(expectedDeleGatorEnvironment);
    });

    it('should reject if an invalid chainId is supplied', async () => {
      const invalidChainId = 12345;

      await expect(
        accountController.getEnvironment({
          chainId: invalidChainId,
        }),
      ).rejects.toThrow(`Unsupported ChainId: ${invalidChainId}`);
    });
  });
});
