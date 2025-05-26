import { describe, expect, it } from '@jest/globals';
import type { CoreCaveatBuilder } from '@metamask/delegation-toolkit';
import { toHex, parseUnits } from 'viem/utils';

import { appendCaveats } from '../../../src/permissions/nativeTokenPeriodic/caveats';
import type { PopulatedNativeTokenPeriodicPermission } from '../../../src/permissions/nativeTokenPeriodic/types';

describe('nativeTokenPeriodic:caveats', () => {
  describe('appendCaveats()', () => {
    const periodAmount = toHex(parseUnits('1', 18));
    const periodDuration = 86400; // 1 day in seconds
    const startTime = 1714531200;

    const mockPermission: PopulatedNativeTokenPeriodicPermission = {
      type: 'native-token-periodic',
      data: {
        periodAmount,
        periodDuration,
        startTime,
        justification: 'test',
      },
      rules: {},
    };

    it('should append nativeTokenPeriodTransfer and exactCalldata caveats', async () => {
      const mockCaveatBuilder = {
        addCaveat: jest.fn().mockReturnThis(),
      } as unknown as jest.Mocked<CoreCaveatBuilder>;

      await appendCaveats({
        permission: mockPermission,
        caveatBuilder: mockCaveatBuilder,
      });

      expect(mockCaveatBuilder.addCaveat).toHaveBeenCalledWith(
        'nativeTokenPeriodTransfer',
        BigInt(periodAmount),
        periodDuration,
        startTime,
      );

      expect(mockCaveatBuilder.addCaveat).toHaveBeenCalledWith(
        'exactCalldata',
        '0x',
      );

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
