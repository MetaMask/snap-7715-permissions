import { describe, it, beforeEach } from '@jest/globals';
import { SnapsProvider } from '@metamask/snaps-sdk';
import { Signer } from '../../src/account/signer';
import { isAddress } from 'viem';
import { Logger } from '../../src/logger';

describe('Signer', () => {
  let signer: Signer;
  let mockSnapsProvider: jest.Mocked<SnapsProvider>;

  beforeEach(() => {
    mockSnapsProvider = {
      request: jest.fn(),
    } as unknown as jest.Mocked<SnapsProvider>;

    signer = new Signer({
      snapsProvider: mockSnapsProvider,
      logger: new Logger(),
    });

    const randomValues = new Uint8Array(32);
    crypto.getRandomValues(randomValues);
    const entropy = `0x${Buffer.from(randomValues).toString('hex')}`;

    mockSnapsProvider.request.mockResolvedValue(entropy);
  });

  describe('getAddress()', () => {
    it('should call the snap provider to get entropy', async () => {
      expect(mockSnapsProvider.request).toHaveBeenCalledTimes(0);

      await signer.getAddress();

      expect(mockSnapsProvider.request).toHaveBeenCalledTimes(1);
      expect(mockSnapsProvider.request).toHaveBeenCalledWith({
        method: 'snap_getEntropy',
        params: { version: 1, salt: '7715_permissions_provider_snap' },
      });
    });

    it('should not call the snap provider to get entropy if already called', async () => {
      expect(mockSnapsProvider.request).toHaveBeenCalledTimes(0);

      await signer.getAddress();

      expect(mockSnapsProvider.request).toHaveBeenCalledTimes(1);

      await signer.getAddress();

      expect(mockSnapsProvider.request).toHaveBeenCalledTimes(1);
    });

    it('should return an address', async () => {
      const address = await signer.getAddress();

      expect(isAddress(address)).toBe(true);
    });

    it('should return the same address with the same entropy', async () => {
      const address = await signer.getAddress();

      const secondAddress = await new Signer({
        snapsProvider: mockSnapsProvider,
        logger: new Logger(),
      }).getAddress();

      expect(address).toBe(secondAddress);
    });
  });

  describe('toAccount()', () => {
    it('should call the snap provider to get entropy', async () => {
      expect(mockSnapsProvider.request).toHaveBeenCalledTimes(0);

      await signer.toAccount();

      expect(mockSnapsProvider.request).toHaveBeenCalledTimes(1);
      expect(mockSnapsProvider.request).toHaveBeenCalledWith({
        method: 'snap_getEntropy',
        params: { version: 1, salt: '7715_permissions_provider_snap' },
      });
    });

    it('should not call the snap provider to get entropy if already called', async () => {
      expect(mockSnapsProvider.request).toHaveBeenCalledTimes(0);

      await signer.toAccount();

      expect(mockSnapsProvider.request).toHaveBeenCalledTimes(1);

      await signer.toAccount();

      expect(mockSnapsProvider.request).toHaveBeenCalledTimes(1);
    });

    it('should return an account with the correct address', async () => {
      const account = await signer.toAccount();

      expect(account.address).toBe(await signer.getAddress());
    });

    it('should return an account with unsupported signing methods', async () => {
      const account = await signer.toAccount();

      expect(account.signMessage).toThrow(
        'Unsupported sign method: signMessage',
      );
      expect(account.signTransaction).toThrow(
        'Unsupported sign method: signTransaction',
      );

      expect(account.signTypedData).toBeDefined();
      const signature = await (account.signTypedData as any)({} as any);

      expect(signature).toBe('0x1234');
    });
  });

  it('should only call the snap provider to get entropy once', async () => {
    expect(mockSnapsProvider.request).toHaveBeenCalledTimes(0);

    await Promise.all([
      signer.getAddress(),
      signer.toAccount(),
      signer.getAddress(),
    ]);

    expect(mockSnapsProvider.request).toHaveBeenCalledTimes(1);
  });
});
