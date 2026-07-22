import { InternalError } from '@metamask/snaps-sdk';

import { createCallOnceGuard } from '../../src/core/callOnceGuard';

describe('createCallOnceGuard', () => {
  it('allows the first call', () => {
    const guard = createCallOnceGuard('Example.method()');

    expect(() => guard()).not.toThrow();
  });

  it('throws InternalError on subsequent calls', () => {
    const guard = createCallOnceGuard('Example.method()');

    guard();

    for (let i = 0; i < 5; i++) {
      expect(() => guard()).toThrow(InternalError);
    }
  });

  it('does not share state across guards', () => {
    const first = createCallOnceGuard('First.method()');
    const second = createCallOnceGuard('Second.method()');

    first();

    expect(() => second()).not.toThrow();
  });
});
