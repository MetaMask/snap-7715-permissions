import { any, z } from 'zod';

import { zAddress, zHexStr } from './common';

export const zPromisedOutcomesTypeDescriptor = z.union([
  z.literal('exact-transfer'),
  z.literal('event-emission'),
  z.literal('custom'),
]);

export type PromisedOutcomesTypeDescriptor = z.infer<
  typeof zPromisedOutcomesTypeDescriptor
>;

export const zPromisedOutcomes = z.object({
  type: zPromisedOutcomesTypeDescriptor,

  /**
   * Data structure varies by promised outcome type.
   */
  data: z.record(any()),
});

export const zExactTransferOutcome = zPromisedOutcomes.extend({
  type: z.literal('exact-transfer'),
  data: z.object({
    address: zAddress,
    amount: zHexStr,
    recipient: zAddress,
    tokenSymbol: z.string(),
  }),
});

export type ExactTransferOutcome = z.infer<typeof zExactTransferOutcome>;

export const zEventEmissionOutcome = zPromisedOutcomes.extend({
  type: z.literal('event-emission'),
  data: z.object({
    eventName: z.string(),
    eventArgs: z.record(any()),
  }),
});
