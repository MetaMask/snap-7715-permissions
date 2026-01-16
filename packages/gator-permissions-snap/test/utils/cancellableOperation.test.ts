import { describe, expect, it, jest } from '@jest/globals';

import { createCancellableOperation } from '../../src/utils/cancellableOperation';

describe('createCancellableOperation', () => {
  it('should execute the operation and call onSuccess when not cancelled', async () => {
    const mockOperation = jest.fn(async (arg: string) => `result-${arg}`);
    const mockOnSuccess = jest.fn(
      async (_result: string, _isCancelled: () => boolean) => Promise.resolve(),
    );

    const execute = createCancellableOperation({
      operation: mockOperation,
      onSuccess: mockOnSuccess,
    });

    await execute('test');

    expect(mockOperation).toHaveBeenCalledWith('test');
    expect(mockOnSuccess).toHaveBeenCalledWith(
      'result-test',
      expect.any(Function),
    );
  });

  it('should cancel previous call when a new call is made', async () => {
    const results: string[] = [];

    // Create a promise that we can control to simulate a slow operation
    let resolveFirst: ((value: string) => void) | undefined;
    const firstOperationPromise = new Promise<string>((resolve) => {
      resolveFirst = resolve;
    });

    let callCount = 0;
    const operation = jest.fn(async (arg: number) => {
      callCount += 1;
      if (callCount === 1) {
        return firstOperationPromise;
      }
      return `result-${arg}`;
    });

    const onSuccess = jest.fn(
      async (result: string, _isCancelled: () => boolean) => {
        results.push(result);
        return Promise.resolve();
      },
    );

    const execute = createCancellableOperation({ operation, onSuccess });

    // Start first operation (will be pending)
    const firstExecute = execute(1);

    // Start second operation immediately (should cancel first)
    await execute(2);

    // Now resolve the first operation
    if (resolveFirst) {
      resolveFirst('result-1');
    }
    await firstExecute;

    // Only the second result should be recorded (first was cancelled)
    expect(results).toStrictEqual(['result-2']);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith('result-2', expect.any(Function));
  });

  it('should only invoke onSuccess for the latest call when multiple rapid calls are made', async () => {
    const results: string[] = [];

    // Create controllable promises for each operation
    const resolvers: ((value: string) => void)[] = [];
    let callIndex = 0;

    const operation = jest.fn(
      async (_arg: number) =>
        new Promise<string>((resolve) => {
          resolvers[callIndex] = resolve;
          callIndex += 1;
        }),
    );

    const onSuccess = jest.fn(
      async (result: string, _isCancelled: () => boolean) => {
        results.push(result);
        return Promise.resolve();
      },
    );

    const execute = createCancellableOperation({ operation, onSuccess });

    // Start three operations in quick succession
    const exec1 = execute(1);
    const exec2 = execute(2);
    const exec3 = execute(3);

    // Resolve them in order
    const resolver0 = resolvers[0];
    const resolver1 = resolvers[1];
    const resolver2 = resolvers[2];

    if (resolver0) {
      resolver0('result-1');
    }
    if (resolver1) {
      resolver1('result-2');
    }
    if (resolver2) {
      resolver2('result-3');
    }

    await Promise.all([exec1, exec2, exec3]);

    // Only the last call's onSuccess should have been invoked
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith('result-3', expect.any(Function));
    expect(results).toStrictEqual(['result-3']);
  });

  it('should provide isCancelled function that detects cancellation during onSuccess async operations', async () => {
    const stateUpdates: string[] = [];
    let capturedIsCancelled: (() => boolean) | undefined;

    // Create a promise we can control to simulate a secondary async operation in onSuccess
    let resolveSecondaryOperation: ((value: string) => void) | undefined;
    const secondaryOperationPromise = new Promise<string>((resolve) => {
      resolveSecondaryOperation = resolve;
    });

    let operationCallCount = 0;
    const operation = jest.fn(async (_arg: number) => {
      operationCallCount += 1;
      return `result-${operationCallCount}`;
    });

    let onSuccessCallCount = 0;
    const onSuccess = jest.fn(
      async (result: string, isCancelled: () => boolean) => {
        onSuccessCallCount += 1;
        const isFirstCall = onSuccessCallCount === 1;

        if (isFirstCall) {
          capturedIsCancelled = isCancelled;
          // First state update (before secondary async operation)
          stateUpdates.push('first-balance');

          // Simulate a secondary async operation (like fetching fiat balance)
          const secondaryResult = await secondaryOperationPromise;

          // Only push if not cancelled
          !isCancelled() && stateUpdates.push(secondaryResult);
        } else {
          stateUpdates.push(result);
        }
      },
    );

    const execute = createCancellableOperation({ operation, onSuccess });

    // Start first operation
    const firstExecute = execute(1);

    // Wait for the first onSuccess to start (it will be waiting on secondaryOperationPromise)
    await new Promise((resolve) => setTimeout(resolve, 0));

    // At this point, the first onSuccess is waiting for secondaryOperationPromise
    // isCancelled should return false
    expect(capturedIsCancelled?.()).toBe(false);

    // Start second operation (should "cancel" the first)
    const secondExecute = execute(2);

    // Now isCancelled should return true for the first operation
    expect(capturedIsCancelled?.()).toBe(true);

    // Complete the second operation
    await secondExecute;

    // Now resolve the secondary operation in the first onSuccess
    if (resolveSecondaryOperation) {
      resolveSecondaryOperation('first-fiat-balance');
    }
    await firstExecute;

    // The first operation should have:
    // 1. Updated state with 'first-balance' (before the secondary async operation)
    // 2. NOT updated state with 'first-fiat-balance' (because isCancelled() returned true)
    // The second operation should have updated state with 'result-2'
    expect(stateUpdates).toStrictEqual([
      'first-balance',
      'result-2',
      // 'first-fiat-balance' should NOT be here because the isCancelled check prevented it
    ]);
  });
});
