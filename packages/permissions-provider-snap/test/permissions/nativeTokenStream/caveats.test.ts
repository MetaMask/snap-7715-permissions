import { describe, expect, it } from '@jest/globals';
import type { CoreCaveatBuilder } from '@metamask/delegation-toolkit';
import { toHex, parseUnits } from 'viem/utils';

import { appendCaveats } from '../../../src/permissions/nativeTokenStream/caveats';
import type { HydratedNativeTokenStreamPermission } from '../../../src/permissions/nativeTokenStream/types';

describe('nativeTokenStream:caveats', () => {
  describe('appendCaveats()', () => {
    const initialAmount = toHex(parseUnits('1', 18));
    const maxAmount = toHex(parseUnits('10', 18));
    const amountPerSecond = toHex(parseUnits('.5', 18));
    const startTime = 1714531200;

    const mockPermission: HydratedNativeTokenStreamPermission = {
      type: 'native-token-stream',
      data: {
        initialAmount,
        maxAmount,
        amountPerSecond,
        startTime,
        justification: 'test',
      },
      rules: {},
    };

    it('should append nativeTokenStreaming and exactCalldata caveats', () => {
      const mockCaveatBuilder = {
        addCaveat: jest.fn().mockReturnThis(),
      } as unknown as jest.Mocked<CoreCaveatBuilder>;

      appendCaveats({
        permission: mockPermission,
        caveatBuilder: mockCaveatBuilder,
      });

      expect(mockCaveatBuilder.addCaveat).toHaveBeenCalledWith(
        'nativeTokenStreaming',
        BigInt(initialAmount),
        BigInt(maxAmount),
        BigInt(amountPerSecond),
        startTime,
      );

      expect(mockCaveatBuilder.addCaveat).toHaveBeenCalledWith(
        'exactCalldata',
        '0x',
      );

      expect(mockCaveatBuilder.addCaveat).toHaveBeenCalledTimes(2);
    });

    it('should return the modified caveat builder', () => {
      const mockCaveatBuilder = {
        addCaveat: jest.fn().mockReturnThis(),
      } as unknown as jest.Mocked<CoreCaveatBuilder>;

      const result = appendCaveats({
        permission: mockPermission,
        caveatBuilder: mockCaveatBuilder,
      });

      expect(result).toBe(mockCaveatBuilder);
    });
  });
});
