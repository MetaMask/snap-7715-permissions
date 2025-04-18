import { toHex } from 'viem';
import {
  formatStreamRatePerSecond,
  TimePeriod,
} from '../../../../src/confirmation/components/StreamAmount';

const SECONDS_PER_DAY = 86_400n;
const ONE_ETH = 1n * 10n ** 18n;

const ONE_ETH__PER_SECOND_AS_ETH_PER_DAY = ONE_ETH * SECONDS_PER_DAY;
const ONE_ETH__PER_WEEK_AS_ETH_PER_DAY =
  ONE_ETH__PER_SECOND_AS_ETH_PER_DAY * 7n;
const ONE_ETH__PER_MONTH_AS_ETH_PER_DAY =
  (ONE_ETH__PER_SECOND_AS_ETH_PER_DAY * 365n) / 12n;

const DECIMALS = 18;

describe('StreamAmount', () => {
  describe('formatStreamRatePerSecond', () => {
    it('should format a daily rate as rate per second', () => {
      const streamRatePerSecond = formatStreamRatePerSecond(
        toHex(ONE_ETH__PER_SECOND_AS_ETH_PER_DAY / 10n),
        TimePeriod.DAILY,
        DECIMALS,
      );

      expect(streamRatePerSecond).toEqual('0.1');
    });

    it('should format a weekly rate as rate per second', () => {
      const streamRatePerSecond = formatStreamRatePerSecond(
        toHex(ONE_ETH__PER_WEEK_AS_ETH_PER_DAY / 10n),
        TimePeriod.WEEKLY,
        DECIMALS,
      );

      expect(streamRatePerSecond).toEqual('0.1');
    });

    it('should format a monthly rate as rate per second', () => {
      const streamRatePerSecond = formatStreamRatePerSecond(
        toHex(ONE_ETH__PER_MONTH_AS_ETH_PER_DAY / 10n),
        TimePeriod.MONTHLY,
        DECIMALS,
      );

      expect(streamRatePerSecond).toEqual('0.1');
    });

    it('should format 0x0 as 0', () => {
      const streamRatePerSecond = formatStreamRatePerSecond(
        toHex(0n),
        TimePeriod.DAILY,
        DECIMALS,
      );

      expect(streamRatePerSecond).toEqual('0');
    });

    it('should format a really small number', () => {
      const streamRatePerSecond = formatStreamRatePerSecond(
        toHex(SECONDS_PER_DAY),
        TimePeriod.DAILY,
        DECIMALS,
      );

      expect(streamRatePerSecond).toEqual('0.000000000000000001');
    });

    it('should format a sufficiently small number as 0', () => {
      const streamRatePerSecond = formatStreamRatePerSecond(
        toHex(1),
        TimePeriod.DAILY,
        DECIMALS,
      );

      expect(streamRatePerSecond).toEqual('0');
    });

    it('should format a really large number', () => {
      const largeNumber = 0xfffffffffffffffffffffffffffffffffffffffffn;
      const streamRatePerSecond = formatStreamRatePerSecond(
        toHex(largeNumber),
        TimePeriod.DAILY,
        0,
      );

      expect(streamRatePerSecond).toEqual(
        (largeNumber / SECONDS_PER_DAY).toString(),
      );
    });
  });
});
