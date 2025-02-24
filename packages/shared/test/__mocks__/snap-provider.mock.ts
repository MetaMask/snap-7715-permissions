import type { RequestArguments } from '@metamask/providers';
import type { SnapsProvider, SnapMethods } from '@metamask/snaps-sdk';

export type MockRequestResult = SnapMethods[keyof SnapMethods][1];
export type MockSnapRequest = jest.Mock<
  Promise<MockRequestResult>,
  [RequestArguments]
>;

/**
 * Creates a mock SnapsProvider for testing.
 *
 * @returns A mock SnapsProvider.
 */
export const createMockSnapsProvider = (): SnapsProvider => {
  const request = jest.fn<Promise<MockRequestResult>, [RequestArguments]>();
  return {
    request,
  };
};
