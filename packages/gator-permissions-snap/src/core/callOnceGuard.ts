import { InternalError } from '@metamask/snaps-sdk';

/**
 * Creates a guard that throws if invoked more than once.
 * @param name - Label included in the error message (e.g. `Foo.bar()`).
 * @returns A function that throws on a second call.
 */
export function createCallOnceGuard(name: string): () => void {
  let called = false;
  return () => {
    if (called) {
      throw new InternalError(`${name} called more than once`);
    }
    called = true;
  };
}
