import type { SnapsProvider } from '@metamask/snaps-sdk';

/**
 * Creates a mock SnapsProvider for testing.
 *
 * @returns A mock SnapsProvider.
 */
export const createMockSnapsProvider = (): jest.Mocked<SnapsProvider> => {
  const request = jest.fn();

  return {
    request,
  };
};
