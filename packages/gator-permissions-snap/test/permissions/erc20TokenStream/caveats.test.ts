import { describe, expect, it } from '@jest/globals';
import type { CoreCaveatBuilder } from '@metamask/delegation-toolkit';
import { toHex, parseUnits } from 'viem/utils';

import { appendCaveats } from '../../../src/permissions/erc20TokenStream/caveats';
import type { PopulatedErc20TokenStreamPermission } from '../../../src/permissions/erc20TokenStream/types';
import { convertReadableDateToTimestamp } from '../../../src/utils/time';

describe('erc20TokenStream:caveats', () => {
  describe('appendCaveats()', () => {
    const tokenDecimals = 10;
    const initialAmount = toHex(parseUnits('1', tokenDecimals));
    const maxAmount = toHex(parseUnits('10', tokenDecimals));
    const amountPerSecond = toHex(parseUnits('.5', tokenDecimals));
    const startTime = convertReadableDateToTimestamp('10/26/2024');
    const tokenAddress = '0x1234567890123456789012345678901234567890';

    const mockPermission: PopulatedErc20TokenStreamPermission = {
      type: 'erc20-token-stream',
      data: {
        initialAmount,
        maxAmount,
        amountPerSecond,
        startTime,
        tokenAddress,
        justification: 'test',
      },
      rules: {},
    };

    it('should append erc20Streaming caveat', async () => {
      const mockCaveatBuilder = {
        addCaveat: jest.fn().mockReturnThis(),
      } as unknown as jest.Mocked<CoreCaveatBuilder>;

      await appendCaveats({
        permission: mockPermission,
        caveatBuilder: mockCaveatBuilder,
      });

      expect(mockCaveatBuilder.addCaveat).toHaveBeenCalledWith(
        'erc20Streaming',
        tokenAddress,
        BigInt(initialAmount),
        BigInt(maxAmount),
        BigInt(amountPerSecond),
        startTime,
      );

      expect(mockCaveatBuilder.addCaveat).toHaveBeenCalledWith('valueLte', 0n);

      expect(mockCaveatBuilder.addCaveat).toHaveBeenCalledTimes(2);
    });

    it('should return the modified caveat builder', async () => {
      const mockCaveatBuilder = {
        addCaveat: jest.fn().mockReturnThis(),
      } as unknown as jest.Mocked<CoreCaveatBuilder>;

      const result = await appendCaveats({
        permission: mockPermission,
        caveatBuilder: mockCaveatBuilder,
      });

      expect(result).toBe(mockCaveatBuilder);
    });
  });
});
