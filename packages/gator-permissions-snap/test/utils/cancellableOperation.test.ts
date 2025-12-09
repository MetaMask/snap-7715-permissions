import { describe, expect, it, jest } from '@jest/globals';

import { createCancellableOperation } from '../../src/utils/cancellableOperation';

describe('createCancellableOperation', () => {
  it('should execute the operation and call onSuccess when not cancelled', async () => {
    const operation = createCancellableOperation<string>();

    const mockOperation = jest.fn(async (arg: string) => `result-${arg}`);
    const mockOnSuccess = jest.fn(async (_result: string) => Promise.resolve());

    await operation.execute('test', mockOperation, mockOnSuccess);

    expect(mockOperation).toHaveBeenCalledWith('test');
    expect(mockOnSuccess).toHaveBeenCalledWith('result-test');
  });

  it('should cancel previous call when a new call is made', async () => {
    const operation = createCancellableOperation<number>();

    const firstOnSuccess = jest.fn(async (_result: string) =>
      Promise.resolve(),
    );
    const secondOnSuccess = jest.fn(async (_result: string) =>
      Promise.resolve(),
    );

    // Create a promise that we can control to simulate a slow operation
    let resolveFirst: ((value: string) => void) | undefined;
    const firstOperationPromise = new Promise<string>((resolve) => {
      resolveFirst = resolve;
    });

    const firstOperation = jest.fn(async () => firstOperationPromise);
    const secondOperation = jest.fn(async () => 'second-result');

    // Start first operation (will be pending)
    const firstExecute = operation.execute(1, firstOperation, firstOnSuccess);

    // Start second operation immediately (should cancel first)
    await operation.execute(2, secondOperation, secondOnSuccess);

    // Now resolve the first operation
    if (resolveFirst) {
      resolveFirst('first-result');
    }
    await firstExecute;

    // First onSuccess should NOT have been called (cancelled)
    expect(firstOnSuccess).not.toHaveBeenCalled();

    // Second onSuccess SHOULD have been called
    expect(secondOnSuccess).toHaveBeenCalledWith('second-result');
  });

  it('should only invoke onSuccess for the latest call when multiple rapid calls are made', async () => {
    const operation = createCancellableOperation<number>();

    const results: string[] = [];
    const onSuccess = jest.fn(async (result: string) => {
      results.push(result);
      return Promise.resolve();
    });

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
    const exec1 = operation.execute(1, op1, onSuccess);
    const exec2 = operation.execute(2, op2, onSuccess);
    const exec3 = operation.execute(3, op3, onSuccess);

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
    expect(onSuccess).toHaveBeenCalledWith('result-3');
    expect(results).toStrictEqual(['result-3']);
  });
});
