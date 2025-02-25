import { describe, it, beforeEach } from '@jest/globals';
import { SnapsProvider } from '@metamask/snaps-sdk';
import { sepolia } from 'viem/chains';
import { Hex, isAddress, isHex } from 'viem';
import { AccountController } from '../../src/account/accountController';
import type { Signer } from '../../src/account/signer';
import { Logger, LogLevel } from '../../src/logger';
import {
  DelegationStruct,
  getDeleGatorEnvironment,
} from '@metamask-private/delegator-core-viem';

describe('AccountController', () => {
  let accountController: AccountController;
  let mockSnapsProvider: jest.Mocked<SnapsProvider>;
  let mockSigner: jest.Mocked<Signer>;

  beforeEach(() => {
    mockSnapsProvider = {
      request: jest.fn(),
    } as unknown as jest.Mocked<SnapsProvider>;

    mockSigner = {
      getAddress: jest.fn(),
      toAccount: jest.fn(),
    } as unknown as jest.Mocked<Signer>;

    accountController = new AccountController({
      snapsProvider: mockSnapsProvider,
      signer: mockSigner,
      supportedChains: [sepolia],
      deploymentSalt: '0x1234',
      logger: new Logger({
        threshold: LogLevel.ERROR,
      }),
    });
  });

  describe('getAccountAddress()', () => {
    it('should get the account address', async () => {
      const expectedAddress = '0x1234567890abcdef1234567890abcdef12345678';
      mockSigner.getAddress.mockResolvedValue(expectedAddress);

      const address = await accountController.getAccountAddress();

      expect(isAddress(address)).toBe(true);
    });
  });

  describe('getAccountMetadata()', () => {
    it('should get the account metadata', async () => {
      const environment = getDeleGatorEnvironment(sepolia.id);

      mockSigner.toAccount.mockResolvedValue({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        signMessage: jest.fn(),
        signTransaction: jest.fn(),
        signTypedData: jest.fn(),
      } as any);

      const metadata = await accountController.getAccountMetadata({
        chainId: sepolia.id,
      });

      expect(metadata.factory).toEqual(environment.SimpleFactory);
      expect(isHex(metadata.factoryData)).toBe(true);

      expect(mockSigner.toAccount).toHaveBeenCalledTimes(1);
    });

    it('should call toAccount() only once', async () => {
      mockSigner.toAccount.mockResolvedValue({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        signMessage: jest.fn(),
        signTransaction: jest.fn(),
        signTypedData: jest.fn(),
      } as any);

      await Promise.all([
        accountController.getAccountMetadata({
          chainId: sepolia.id,
        }),
        accountController.getAccountMetadata({
          chainId: sepolia.id,
        }),
      ]);

      expect(mockSigner.toAccount).toHaveBeenCalledTimes(1);
    });
  });

  describe('signDelegation()', () => {
    const unsignedDelegation: Omit<DelegationStruct, 'signature'> = {
      delegator: '0x1234567890abcdef1234567890abcdef12345678',
      delegate: '0x1234567890abcdef1234567890abcdef12345678',
      authority: '0x0000000000000000000000000000000000000001',
      caveats: [],
      salt: 1n,
    };

    const mockSignature: Hex = '0xmocksignature';

    beforeEach(() => {
      mockSigner.toAccount.mockReset();
      mockSigner.toAccount.mockResolvedValue({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        signMessage: jest.fn(), // not used so no need to mock
        signTransaction: jest.fn(), // not used so no need to mock
        signTypedData: jest.fn(async () => mockSignature),
      } as any);
    });

    it('should sign a delegation', async () => {
      const signedDelegation = await accountController.signDelegation({
        chainId: sepolia.id,
        delegation: unsignedDelegation,
      });

      expect(signedDelegation).toEqual({
        ...unsignedDelegation,
        signature: expect.any(String),
      });

      expect(mockSigner.toAccount).toHaveBeenCalledTimes(1);
    });

    it('should call toAccount() only once for multiple signatures', async () => {
      await Promise.all([
        accountController.signDelegation({
          chainId: sepolia.id,
          delegation: unsignedDelegation,
        }),
        accountController.signDelegation({
          chainId: sepolia.id,
          delegation: unsignedDelegation,
        }),
      ]);

      expect(mockSigner.toAccount).toHaveBeenCalledTimes(1);
    });
  });
});
