import { numberToHex } from '@metamask/utils';
import { sepolia, mainnet } from 'viem/chains';

import { BlockchainTokenMetadataClient } from '../../src/clients/blockchainMetadataClient';

describe('BlockchainTokenMetadataClient', () => {
  const mockEthereumProvider = {
    request: jest.fn(),
  };
  let client = new BlockchainTokenMetadataClient({
    ethereumProvider: mockEthereumProvider,
  });

  beforeEach(() => {
    mockEthereumProvider.request.mockClear();
    client = new BlockchainTokenMetadataClient({
      ethereumProvider: mockEthereumProvider,
    });
  });

  describe('getTokenBalanceAndMetadata', () => {
    const mockAccount = '0x4f10501E98476Bc5c7C322a8ae87226aFC8a66a2';
    const mockTokenAddress = '0x6b175474e89094c44da98b954eedeac495271d0f';
    const mockChainId = sepolia.id;

    it('fetches native token balance and metadata successfully', async () => {
      mockEthereumProvider.request
        .mockResolvedValueOnce(numberToHex(mockChainId)) // eth_chainId
        .mockResolvedValueOnce('0xde0b6b3a7640000'); // eth_getBalance (1 ETH in wei)

      const result = await client.getTokenBalanceAndMetadata({
        chainId: mockChainId,
        account: mockAccount,
      });

      expect(result).toStrictEqual({
        balance: BigInt('1000000000000000000'),
        decimals: 18,
        symbol: 'ETH',
      });

      expect(mockEthereumProvider.request).toHaveBeenCalledTimes(2);
      expect(mockEthereumProvider.request).toHaveBeenNthCalledWith(1, {
        method: 'eth_chainId',
        params: [],
      });
      expect(mockEthereumProvider.request).toHaveBeenNthCalledWith(2, {
        method: 'eth_getBalance',
        params: [mockAccount, 'latest'],
      });
    });

    it('fetches ERC20 token balance and metadata successfully', async () => {
      mockEthereumProvider.request
        .mockResolvedValueOnce(numberToHex(mockChainId)) // eth_chainId
        .mockResolvedValueOnce(
          '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000',
        ) // balanceOf
        .mockResolvedValueOnce(
          '0x0000000000000000000000000000000000000000000000000000000000000012',
        ) // decimals
        .mockResolvedValueOnce(
          '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000034441490000000000000000000000000000000000000000000000000000000000',
        ); // symbol

      const result = await client.getTokenBalanceAndMetadata({
        chainId: mockChainId,
        account: mockAccount,
        assetAddress: mockTokenAddress,
      });

      expect(result).toStrictEqual({
        balance: BigInt('1000000000000000000'),
        decimals: 18,
        symbol: 'DAI',
      });

      expect(mockEthereumProvider.request).toHaveBeenCalledTimes(4);
      expect(mockEthereumProvider.request).toHaveBeenNthCalledWith(1, {
        method: 'eth_chainId',
        params: [],
      });
    });

    it('throws an error if chainId is not provided', async () => {
      await expect(
        client.getTokenBalanceAndMetadata({
          chainId: 0,
          account: mockAccount,
        }),
      ).rejects.toThrow('No chainId provided to fetch token balance');
      expect(mockEthereumProvider.request).not.toHaveBeenCalled();
    });

    it('throws an error if account is not provided', async () => {
      await expect(
        client.getTokenBalanceAndMetadata({
          chainId: mockChainId,
          account: '' as any,
        }),
      ).rejects.toThrow('No account address provided to fetch token balance');
      expect(mockEthereumProvider.request).not.toHaveBeenCalled();
    });

    it('throws an error if selected chain does not match requested chain', async () => {
      mockEthereumProvider.request.mockResolvedValueOnce(
        numberToHex(mainnet.id),
      ); // eth_chainId

      await expect(
        client.getTokenBalanceAndMetadata({
          chainId: mockChainId,
          account: mockAccount,
        }),
      ).rejects.toThrow('Selected chain does not match the requested chain');
    });

    it('throws an error if native token balance fetch fails', async () => {
      mockEthereumProvider.request
        .mockResolvedValueOnce(numberToHex(mockChainId)) // eth_chainId
        .mockResolvedValueOnce(null); // eth_getBalance

      await expect(
        client.getTokenBalanceAndMetadata({
          chainId: mockChainId,
          account: mockAccount,
        }),
      ).rejects.toThrow('Failed to fetch native token balance');
    });

    it('throws an error if ERC20 token balance fetch fails', async () => {
      mockEthereumProvider.request
        .mockResolvedValueOnce(numberToHex(mockChainId)) // eth_chainId
        .mockResolvedValueOnce(null) // balanceOf
        .mockResolvedValueOnce(
          '0x0000000000000000000000000000000000000000000000000000000000000012',
        ) // decimals
        .mockResolvedValueOnce(
          '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000034441490000000000000000000000000000000000000000000000000000000000',
        ); // symbol

      await expect(
        client.getTokenBalanceAndMetadata({
          chainId: mockChainId,
          account: mockAccount,
          assetAddress: mockTokenAddress,
        }),
      ).rejects.toThrow('Failed to fetch token balance');
    });

    it('throws an error if ERC20 token decimals fetch fails', async () => {
      mockEthereumProvider.request
        .mockResolvedValueOnce(numberToHex(mockChainId)) // eth_chainId
        .mockResolvedValueOnce(
          '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000',
        ) // balanceOf
        .mockResolvedValueOnce(null) // decimals
        .mockResolvedValueOnce(
          '0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000034441490000000000000000000000000000000000000000000000000000000000',
        ); // symbol

      await expect(
        client.getTokenBalanceAndMetadata({
          chainId: mockChainId,
          account: mockAccount,
          assetAddress: mockTokenAddress,
        }),
      ).rejects.toThrow('Failed to fetch token decimals');
    });

    it('throws an error if ERC20 token symbol fetch fails', async () => {
      mockEthereumProvider.request
        .mockResolvedValueOnce(numberToHex(mockChainId)) // eth_chainId
        .mockResolvedValueOnce(
          '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000',
        ) // balanceOf
        .mockResolvedValueOnce(
          '0x0000000000000000000000000000000000000000000000000000000000000012',
        ) // decimals
        .mockResolvedValueOnce(null); // symbol

      await expect(
        client.getTokenBalanceAndMetadata({
          chainId: mockChainId,
          account: mockAccount,
          assetAddress: mockTokenAddress,
        }),
      ).rejects.toThrow('Failed to fetch token symbol');
    });
  });
});
