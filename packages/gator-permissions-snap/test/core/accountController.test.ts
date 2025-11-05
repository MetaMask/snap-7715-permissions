import { describe, it, beforeEach, expect } from '@jest/globals';
import { createMockSnapsProvider } from '@metamask/7715-permissions-shared/testing';
import type { Delegation } from '@metamask/delegation-core';

import { AccountController } from '../../src/core/accountController';

const sepolia = 11155111;

describe('AccountController', () => {
  const mockAddress = '0x1234567890abcdef1234567890abcdef12345678';
  const mockChainId = '0xaa36a7'; // Sepolia in hex
  const mockSignature =
    '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef11';
  const expectedBalance = '0x1000000000000000000';
  const origin = 'https://example.com';
  const justification = 'Test justification';

  let accountController: AccountController;
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
        case 'wallet_getAccountUpgradeStatus':
          return {
            isUpgraded: false,
            upgradedAddress: null,
          };
        case 'wallet_upgradeAccount':
          return {
            transactionHash:
              '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          };
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

    accountController = new AccountController({
      snapsProvider: mockSnapsProvider,
      ethereumProvider: mockEthereumProvider,
    });
  });

  describe('constructor()', () => {
    it('should create an instance', () => {
      expect(accountController).toBeDefined();
    });
  });

  describe('getAccountAddresses()', () => {
    it('returns the addresses of the accounts', async () => {
      const addresses = await accountController.getAccountAddresses();
      expect(addresses).toStrictEqual([mockAddress]);

      expect(mockEthereumProvider.request).toHaveBeenCalledWith({
        method: 'eth_requestAccounts',
      });
    });
  });

  describe('getAccountUpgradeStatus()', () => {
    it('should return upgrade status', async () => {
      mockEthereumProvider.request.mockResolvedValueOnce({
        isUpgraded: true,
        upgradedAddress: '0x63c0c19a282a1B52b07dD5a65b58948A07DAE32B', // eip7702StatelessDeleGatorImpl address
      });

      const result = await accountController.getAccountUpgradeStatus({
        account: mockAddress,
        chainId: mockChainId,
      });

      expect(result).toStrictEqual({ isUpgraded: true });
    });
  });

  describe('upgradeAccount()', () => {
    it('should upgrade account and return transaction hash', async () => {
      const mockTransactionHash =
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      mockEthereumProvider.request.mockResolvedValueOnce({
        transactionHash: mockTransactionHash,
      });

      const result = await accountController.upgradeAccount({
        account: mockAddress,
        chainId: mockChainId,
      });

      expect(result).toStrictEqual({
        transactionHash: mockTransactionHash,
      });
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
        address: mockAddress,
        origin,
        justification,
      });

      expect(signedDelegation).toStrictEqual({
        ...unsignedDelegation,
        signature: mockSignature,
      });

      expect(signedDelegation.signature).toStrictEqual(mockSignature);
    });

    it('should switch chain if chain ID does not match', async () => {
      mockEthereumProvider.request.mockResolvedValueOnce('0x1'); // Different chain ID
      mockEthereumProvider.request.mockResolvedValueOnce('OK'); // switch chain
      mockEthereumProvider.request.mockResolvedValueOnce(mockChainId); // correct chain ID
      mockEthereumProvider.request.mockResolvedValueOnce(mockSignature); // signature

      const signature = await accountController.signDelegation({
        chainId: sepolia,
        delegation: unsignedDelegation,
        address: mockAddress,
        origin,
        justification,
      });

      expect(signature).toStrictEqual({
        ...unsignedDelegation,
        signature: mockSignature,
      });

      expect(mockEthereumProvider.request).toHaveBeenCalledWith({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: mockChainId }],
      });
    });

    it('should reject if signing fails', async () => {
      mockEthereumProvider.request.mockResolvedValueOnce(mockChainId);
      mockEthereumProvider.request.mockResolvedValueOnce(null); // Failed signature

      await expect(
        accountController.signDelegation({
          chainId: sepolia,
          delegation: unsignedDelegation,
          address: mockAddress,
          origin,
          justification,
        }),
      ).rejects.toThrow('Failed to sign delegation');
    });

    it('calls eth_signTypedData_v4 with the correct params', async () => {
      await accountController.signDelegation({
        chainId: sepolia,
        delegation: unsignedDelegation,
        address: mockAddress,
        origin,
        justification,
      });

      expect(mockEthereumProvider.request).toHaveBeenCalledWith({
        method: 'eth_signTypedData_v4',
        params: [
          mockAddress,
          {
            domain: {
              chainId: sepolia,
              name: 'DelegationManager',
              version: '1',
              verifyingContract: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
            },
            types: {
              Caveat: [
                { name: 'enforcer', type: 'address' },
                { name: 'terms', type: 'bytes' },
              ],
              Delegation: [
                {
                  name: 'delegate',
                  type: 'address',
                },
                {
                  name: 'delegator',
                  type: 'address',
                },
                {
                  name: 'authority',
                  type: 'bytes32',
                },
                {
                  name: 'caveats',
                  type: 'Caveat[]',
                },
                {
                  name: 'salt',
                  type: 'uint256',
                },
              ],
              EIP712Domain: [
                {
                  name: 'name',
                  type: 'string',
                },
                {
                  name: 'version',
                  type: 'string',
                },
                {
                  name: 'chainId',
                  type: 'uint256',
                },
                {
                  name: 'verifyingContract',
                  type: 'address',
                },
              ],
            },
            primaryType: 'Delegation',
            message: {
              ...unsignedDelegation,
              salt: '0x1',
            },
            metadata: {
              origin,
              justification,
            },
          },
        ],
      });
    });
  });
});
