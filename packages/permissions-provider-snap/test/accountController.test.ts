import { describe, it, beforeEach } from '@jest/globals';
import { SnapsProvider } from '@metamask/snaps-sdk';
import { sepolia } from 'viem/chains';
import { isHex, size } from 'viem';
import { AccountController } from '../src/accountController';
import { Logger, LogLevel } from '../src/logger';
import {
  createRootDelegation,
  getDeleGatorEnvironment,
} from '@metamask-private/delegator-core-viem';

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
    mockSnapsProvider.request.mockImplementation((req) => {
      const { method, params } = req;

      switch (method as string) {
        case 'snap_getEntropy':
          return Promise.resolve(entropy);
        case 'snap_experimentalProviderRequest':
          const {
            request: { method: internalMethod },
          } = params as {
            request: { method: string };
          };

          if (internalMethod === 'eth_getBalance') {
            return Promise.resolve(expectedBalance);
          } else if (internalMethod === 'eth_getCode') {
            return Promise.resolve('0x');
          }
      }

      return Promise.resolve(null);
    });

    accountController = new AccountController({
      snapsProvider: mockSnapsProvider,
      supportedChains: [sepolia],
      deploymentSalt: '0x1234',
      logger: new Logger({
        threshold: LogLevel.ERROR,
      }),
    });
  });

  describe('getAccountAddress()', () => {
    it('should get the account address', async () => {
      mockSnapsProvider.request.mockResolvedValueOnce(entropy);

      const address = await accountController.getAccountAddress({
        chainId: sepolia.id,
      });

      expect(address).toEqual(expectedAddress);
    });
  });

  describe('getAccountMetadata()', () => {
    it('should get the account metadata', async () => {
      const environment = getDeleGatorEnvironment(sepolia.id);

      const metadata = await accountController.getAccountMetadata({
        chainId: sepolia.id,
      });

      expect(metadata.factory).toEqual(environment.SimpleFactory);
      expect(isHex(metadata.factoryData)).toBe(true);
    });
  });

  describe('getAccountBalance()', () => {
    it('should get the account balance', async () => {
      const balance = await accountController.getAccountBalance({
        chainId: sepolia.id,
      });

      expect(balance).toEqual(expectedBalance);
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

      expect(signedDelegation).toEqual({
        ...unsignedDelegation,
        signature: expect.any(String),
      });

      expect(isHex(signedDelegation.signature)).toBe(true);

      const EXPECTED_EOA_SIGNATURE_LENGTH = 65;
      expect(size(signedDelegation.signature)).toBe(
        EXPECTED_EOA_SIGNATURE_LENGTH,
      );
    });
  });
});
