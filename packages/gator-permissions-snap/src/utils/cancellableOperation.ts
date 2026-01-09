/**
 * Creates a cancellable operation that automatically cancels previous
 * executions when a new one starts. Useful for background async operations
 * where only the latest result matters.
 *
 * @param options - The operation configuration.
 * @param options.operation - The async operation to execute.
 * @param options.onSuccess - Callback invoked with the result if not cancelled.
 * Receives an `isCancelled` function to check cancellation status during
 * async operations within the callback.
 * @returns An async function that executes the operation with the given argument.
 */
export function createCancellableOperation<TArg, TResult>({
  operation,
  onSuccess,
}: {
  operation: (arg: TArg) => Promise<TResult>;
  onSuccess: (result: TResult, isCancelled: () => boolean) => Promise<void>;
}): (arg: TArg) => Promise<void> {
  let callCounter = 0;

  /**
   * Executes the operation. If called again before completion,
   * the previous call will be cancelled (the callback won't be invoked).
   *
   * @param arg - The argument to pass to the operation.
   * @returns A promise that resolves when the operation completes (whether cancelled or not).
   */
  return async function execute(arg: TArg): Promise<void> {
    callCounter += 1;
    const currentCall = callCounter;

    const result = await operation(arg);

    // Check if this call is still the latest
    if (currentCall !== callCounter) {
      return;
    }

    const isCancelled = (): boolean => currentCall !== callCounter;
    await onSuccess(result, isCancelled);
  };
}
