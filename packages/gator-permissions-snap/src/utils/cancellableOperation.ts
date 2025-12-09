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
   * @param arg - The argument to pass to the operation.
   * @param operation - The async operation to execute.
   * @param onSuccess - Callback invoked with the result if not cancelled.
   * @returns A promise that resolves when the operation completes (whether cancelled or not).
   */
  async function execute<TResult>(
    arg: TArg,
    operation: (arg: TArg) => Promise<TResult>,
    onSuccess: (result: TResult) => Promise<void>,
  ): Promise<void> {
    callCounter += 1;
    const currentCall = callCounter;

    const result = await operation(arg);

    // Check if this call is still the latest
    if (currentCall !== callCounter) {
      return;
    }

    await onSuccess(result);
  }

  return { execute };
}
