import { createTimeoutFactory } from '../../src/core/timeoutFactory';

describe('createTimeoutFactory', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('invokes onTimeout after the configured delay', () => {
    const onTimeout = jest.fn();
    const timeoutMs = 1000;
    const factory = createTimeoutFactory({ timeoutMs });

    const timeout = factory.register({ onTimeout });
    expect(onTimeout).not.toHaveBeenCalled();

    // Advance just before the timeout; should not fire yet
    jest.advanceTimersByTime(timeoutMs - 1);
    expect(onTimeout).not.toHaveBeenCalled();

    // Advance to reach the timeout; should fire once
    jest.advanceTimersByTime(1);
    expect(onTimeout).toHaveBeenCalledTimes(1);

    // Cancel after firing should be a no-op but still be callable
    expect(() => timeout.cancel()).not.toThrow();
  });

  it('does not invoke onTimeout if cancelled before the delay', () => {
    const onTimeout = jest.fn();
    const timeoutMs = 500;
    const factory = createTimeoutFactory({ timeoutMs });

    const timeout = factory.register({ onTimeout });
    timeout.cancel();

    expect(onTimeout).not.toHaveBeenCalled();
    // Advance beyond the configured timeout; should remain not called
    jest.advanceTimersByTime(timeoutMs);
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('returns an object with a cancel function', () => {
    const factory = createTimeoutFactory({ timeoutMs: 10 });
    const timeout = factory.register({ onTimeout: () => undefined });
    expect(typeof timeout.cancel).toBe('function');
  });
});
