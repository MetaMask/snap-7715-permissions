import { describe, it, beforeEach } from '@jest/globals';
import { SnapsProvider } from '@metamask/snaps-sdk';
import { AccountController } from '../src/account/accountController';
import { Signer } from '../src/account/signer';
import { mainnet } from 'viem/chains';
import { isAddress } from 'viem';

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
      supportedChains: [mainnet],
      deploymentSalt: '0x1234',
    });
  });

  describe('getAccountAddress()', () => {
    it('should get the account address', async () => {
      const expectedAddress = '0x1234567890abcdef1234567890abcdef12345678';
      mockSigner.getAddress.mockResolvedValue(expectedAddress);

      const address = await accountController.getAccountAddress({
        chainId: mainnet.id,
      });

      expect(isAddress(address)).toBe(true);
    });
  });

  describe('signDelegation()', () => {
    // Tests will go here
  });
});
