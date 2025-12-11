/**
 * Creates a cancellable operation wrapper that automatically cancels previous
 * executions when a new one starts. Useful for background async operations
 * where only the latest result matters.
 *
 * @returns An object with an `execute` function to run operations.
 */
export function createCancellableOperation<TArg>() {
  let callCounter = 0;

  /**
   * Executes the operation. If the operation is called again before completion,
   * the previous call will be cancelled (the callback won't be invoked).
   *
   * @param options - The execution options.
   * @param options.arg - The argument to pass to the operation.
   * @param options.operation - The async operation to execute.
   * @param options.onSuccess - Callback invoked with the result if not cancelled.
   * Receives an `isCancelled` function to check cancellation status during
   * async operations within the callback.
   * @returns A promise that resolves when the operation completes (whether cancelled or not).
   */
  async function execute<TResult>({
    arg,
    operation,
    onSuccess,
  }: {
    arg: TArg;
    operation: (arg: TArg) => Promise<TResult>;
    onSuccess: (result: TResult, isCancelled: () => boolean) => Promise<void>;
  }): Promise<void> {
    callCounter += 1;
    const currentCall = callCounter;

    const result = await operation(arg);

    // Check if this call is still the latest
    if (currentCall !== callCounter) {
      return;
    }

    const isCancelled = () => currentCall !== callCounter;
    await onSuccess(result, isCancelled);
  }

  return { execute };
}
