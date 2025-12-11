import { describe, expect, it, jest } from '@jest/globals';

import { createCancellableOperation } from '../../src/utils/cancellableOperation';

describe('createCancellableOperation', () => {
  it('should execute the operation and call onSuccess when not cancelled', async () => {
    const operation = createCancellableOperation<string>();

    const mockOperation = jest.fn(async (arg: string) => `result-${arg}`);
    const mockOnSuccess = jest.fn(
      async (_result: string, _isCancelled: () => boolean) => Promise.resolve(),
    );

    await operation.execute({
      arg: 'test',
      operation: mockOperation,
      onSuccess: mockOnSuccess,
    });

    expect(mockOperation).toHaveBeenCalledWith('test');
    expect(mockOnSuccess).toHaveBeenCalledWith(
      'result-test',
      expect.any(Function),
    );
  });

  it('should cancel previous call when a new call is made', async () => {
    const operation = createCancellableOperation<number>();

    const firstOnSuccess = jest.fn(
      async (_result: string, _isCancelled: () => boolean) => Promise.resolve(),
    );
    const secondOnSuccess = jest.fn(
      async (_result: string, _isCancelled: () => boolean) => Promise.resolve(),
    );

    // Create a promise that we can control to simulate a slow operation
    let resolveFirst: ((value: string) => void) | undefined;
    const firstOperationPromise = new Promise<string>((resolve) => {
      resolveFirst = resolve;
    });

    const firstOperation = jest.fn(async () => firstOperationPromise);
    const secondOperation = jest.fn(async () => 'second-result');

    // Start first operation (will be pending)
    const firstExecute = operation.execute({
      arg: 1,
      operation: firstOperation,
      onSuccess: firstOnSuccess,
    });

    // Start second operation immediately (should cancel first)
    await operation.execute({
      arg: 2,
      operation: secondOperation,
      onSuccess: secondOnSuccess,
    });

    // Now resolve the first operation
    if (resolveFirst) {
      resolveFirst('first-result');
    }
    await firstExecute;

    // First onSuccess should NOT have been called (cancelled)
    expect(firstOnSuccess).not.toHaveBeenCalled();

    // Second onSuccess SHOULD have been called
    expect(secondOnSuccess).toHaveBeenCalledWith(
      'second-result',
      expect.any(Function),
    );
  });

  it('should only invoke onSuccess for the latest call when multiple rapid calls are made', async () => {
    const operation = createCancellableOperation<number>();

    const results: string[] = [];
    const onSuccess = jest.fn(
      async (result: string, _isCancelled: () => boolean) => {
        results.push(result);
        return Promise.resolve();
      },
    );

    // Create controllable promises for each operation
    const resolvers: ((value: string) => void)[] = [];
    const createOperation = (index: number) =>
      jest.fn(
        async () =>
          new Promise<string>((resolve) => {
            resolvers[index] = resolve;
          }),
      );

    const op1 = createOperation(0);
    const op2 = createOperation(1);
    const op3 = createOperation(2);

    // Start three operations in quick succession
    const exec1 = operation.execute({ arg: 1, operation: op1, onSuccess });
    const exec2 = operation.execute({ arg: 2, operation: op2, onSuccess });
    const exec3 = operation.execute({ arg: 3, operation: op3, onSuccess });

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
    const operation = createCancellableOperation<number>();

    const stateUpdates: string[] = [];
    let capturedIsCancelled: (() => boolean) | undefined;

    // Create a promise we can control to simulate a secondary async operation in onSuccess
    let resolveSecondaryOperation: ((value: string) => void) | undefined;
    const secondaryOperationPromise = new Promise<string>((resolve) => {
      resolveSecondaryOperation = resolve;
    });

    const firstOnSuccess = jest.fn(
      async (_result: string, isCancelled: () => boolean) => {
        capturedIsCancelled = isCancelled;
        // First state update (before secondary async operation)
        stateUpdates.push('first-balance');

        // Simulate a secondary async operation (like fetching fiat balance)
        const secondaryResult = await secondaryOperationPromise;

        // Only push if not cancelled (using short-circuit evaluation to avoid if statement)
        !isCancelled() && stateUpdates.push(secondaryResult);
      },
    );

    const secondOnSuccess = jest.fn(
      async (result: string, _isCancelled: () => boolean) => {
        stateUpdates.push(result);
        return Promise.resolve();
      },
    );

    const firstOperation = jest.fn(async () => 'first-result');
    const secondOperation = jest.fn(async () => 'second-result');

    // Start first operation
    const firstExecute = operation.execute({
      arg: 1,
      operation: firstOperation,
      onSuccess: firstOnSuccess,
    });

    // Wait for the first onSuccess to start (it will be waiting on secondaryOperationPromise)
    await new Promise((resolve) => setTimeout(resolve, 0));

    // At this point, the first onSuccess is waiting for secondaryOperationPromise
    // isCancelled should return false
    expect(capturedIsCancelled?.()).toBe(false);

    // Start second operation (should "cancel" the first)
    const secondExecute = operation.execute({
      arg: 2,
      operation: secondOperation,
      onSuccess: secondOnSuccess,
    });

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
    // The second operation should have updated state with 'second-result'
    expect(stateUpdates).toStrictEqual([
      'first-balance',
      'second-result',
      // 'first-fiat-balance' should NOT be here because the isCancelled check prevented it
    ]);
  });
});
