import { describe, it, beforeEach, expect } from '@jest/globals';
import { createMockSnapsProvider } from '@metamask/7715-permissions-shared/testing';
import { isHex, size } from 'viem';

import { EoaAccountController } from '../../src/accountController/eoaAccountController';
import { Delegation } from '@metamask/delegation-core';

const sepolia = 11155111;
const mainnet = 1;

describe('EoaAccountController', () => {
  const mockAddress = '0x1234567890abcdef1234567890abcdef12345678';
  const mockChainId = '0xaa36a7'; // Sepolia in hex
  const mockSignature =
    '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1';
  const expectedBalance = '0x1000000000000000000';

  let accountController: EoaAccountController;
  let mockSnapsProvider: ReturnType<typeof createMockSnapsProvider>;
  let mockEthereumProvider: {
    request: jest.Mock;
  };

  beforeEach(() => {
    mockSnapsProvider = createMockSnapsProvider();

    mockEthereumProvider = {
      request: jest.fn(),
    };

    mockEthereumProvider.request.mockImplementation(async (req) => {
      const { method } = req;

      switch (method) {
        case 'eth_requestAccounts':
          return [mockAddress];
        case 'eth_chainId':
          return mockChainId;
        case 'eth_signTypedData_v4':
          return mockSignature;
        case 'eth_getBalance':
          return expectedBalance;
        default:
          return null;
      }
    });

    mockSnapsProvider.request.mockImplementation(async (req) => {
      const { method, params } = req;

      switch (method as string) {
        case 'snap_experimentalProviderRequest': {
          const {
            request: { method: internalMethod },
          } = params as {
            request: { method: string };
          };

          if (internalMethod === 'eth_getBalance') {
            return expectedBalance;
          }
          break;
        }
        default:
          break;
      }

      return null;
    });

    accountController = new EoaAccountController({
      snapsProvider: mockSnapsProvider,
      ethereumProvider: mockEthereumProvider,
      supportedChains: [mainnet, sepolia],
    });
  });

  describe('constructor()', () => {
    it('should throw if no supported chains are specified', () => {
      expect(
        () =>
          new EoaAccountController({
            snapsProvider: mockSnapsProvider,
            ethereumProvider: mockEthereumProvider,
            supportedChains: [],
          }),
      ).toThrow('No supported chains specified');
    });

    it('should throw if an unsupported chain is specified', () => {
      expect(
        () =>
          new EoaAccountController({
            snapsProvider: mockSnapsProvider,
            ethereumProvider: mockEthereumProvider,
            supportedChains: [123],
          }),
      ).toThrow('Unsupported chains specified: 123');
    });
  });

  describe('getAccountAddress()', () => {
    it('should get the account address', async () => {
      const address = await accountController.getAccountAddress({
        chainId: sepolia,
      });

      expect(address).toBe(mockAddress);
      expect(mockEthereumProvider.request).toHaveBeenCalledWith({
        method: 'eth_requestAccounts',
      });
    });

    it('should cache the account address', async () => {
      await accountController.getAccountAddress({
        chainId: sepolia,
      });
      await accountController.getAccountAddress({
        chainId: sepolia,
      });

      expect(mockEthereumProvider.request).toHaveBeenCalledTimes(1);
    });

    it('should reject if no accounts are found', async () => {
      mockEthereumProvider.request.mockResolvedValueOnce([]);

      await expect(
        accountController.getAccountAddress({
          chainId: sepolia,
        }),
      ).rejects.toThrow('No accounts found');
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

  describe('signDelegation()', () => {
    const unsignedDelegation: Omit<Delegation, 'signature'> = {
      delegate: '0x1234567890abcdef1234567890abcdef12345678',
      delegator: '0x1234567890abcdef1234567890abcdef12345678',
      caveats: [],
      authority: '0x1234567890abcdef1234567890abcdef12345678',
      salt: BigInt('0x1'), // Example salt
    };

    it('should sign a delegation', async () => {
      const signedDelegation = await accountController.signDelegation({
        chainId: sepolia,
        delegation: unsignedDelegation,
      });

      expect(signedDelegation).toStrictEqual({
        ...unsignedDelegation,
        signature: mockSignature,
      });

      expect(isHex(signedDelegation.signature)).toBe(true);
      expect(size(signedDelegation.signature)).toBe(65);
    });

    it('should reject if chain ID does not match', async () => {
      mockEthereumProvider.request.mockResolvedValueOnce([mockAddress]);
      mockEthereumProvider.request.mockResolvedValueOnce('0x1'); // Different chain ID

      await expect(
        accountController.signDelegation({
          chainId: sepolia,
          delegation: unsignedDelegation,
        }),
      ).rejects.toThrow('Selected chain does not match the requested chain');
    });

    it('should reject if signing fails', async () => {
      mockEthereumProvider.request.mockResolvedValueOnce([mockAddress]);
      mockEthereumProvider.request.mockResolvedValueOnce(mockChainId);
      mockEthereumProvider.request.mockResolvedValueOnce(null); // Failed signature

      await expect(
        accountController.signDelegation({
          chainId: sepolia,
          delegation: unsignedDelegation,
        }),
      ).rejects.toThrow('Failed to sign delegation');
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

  describe('getAccountMetadata()', () => {
    it('should return empty metadata for EOA accounts', async () => {
      const metadata = await accountController.getAccountMetadata({
        chainId: sepolia,
      });

      expect(metadata).toStrictEqual({
        factory: undefined,
        factoryData: undefined,
      });
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
});
