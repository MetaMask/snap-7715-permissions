import { createTimeoutFactory } from '../../src/core/timeoutFactory';

describe('createTimeoutFactory', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('invokes onTimeout after the configured delay', () => {
    const onTimeout = jest.fn(async () => Promise.resolve());
    const timeoutMs = 1000;
    const factory = createTimeoutFactory({ timeoutMs });

    factory.register({ onTimeout });
    expect(onTimeout).not.toHaveBeenCalled();

    // Advance just before the timeout; should not fire yet
    jest.advanceTimersByTime(timeoutMs - 1);
    expect(onTimeout).not.toHaveBeenCalled();

    // Advance to reach the timeout; should fire once
    jest.advanceTimersByTime(1);
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it('does not invoke onTimeout if cancelled before the delay', () => {
    const onTimeout = jest.fn(async () => Promise.resolve());
    const timeoutMs = 500;
    const factory = createTimeoutFactory({ timeoutMs });

    const timeout = factory.register({ onTimeout });
    timeout.cancel();

    expect(onTimeout).not.toHaveBeenCalled();
    // Advance beyond the configured timeout; should remain not called
    jest.advanceTimersByTime(timeoutMs);
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('allows cancel to be called after the delay', () => {
    const onTimeout = jest.fn(async () => Promise.resolve());
    const timeoutMs = 1000;
    const factory = createTimeoutFactory({ timeoutMs });

    const { cancel } = factory.register({ onTimeout });
    expect(onTimeout).not.toHaveBeenCalled();

    jest.advanceTimersByTime(timeoutMs);
    expect(onTimeout).toHaveBeenCalledTimes(1);

    cancel();
  });

  it('allows cancel to be called multiple times', () => {
    const onTimeout = jest.fn(async () => Promise.resolve());
    const timeoutMs = 1000;
    const factory = createTimeoutFactory({ timeoutMs });

    const { cancel } = factory.register({ onTimeout });
    expect(onTimeout).not.toHaveBeenCalled();

    cancel();
    cancel();

    jest.advanceTimersByTime(timeoutMs);
    expect(onTimeout).toHaveBeenCalledTimes(0);

    cancel();
    cancel();
  });

  it('returns an object with a cancel function', () => {
    const factory = createTimeoutFactory({ timeoutMs: 10 });
    const timeout = factory.register({
      onTimeout: async () => undefined,
    });
    expect(typeof timeout.cancel).toBe('function');
  });

  it('handle errors in onTimeout', () => {
    const onTimeout = jest.fn(async () => Promise.reject(new Error('test')));
    const timeoutMs = 1000;
    const factory = createTimeoutFactory({ timeoutMs });

    factory.register({ onTimeout });
    expect(onTimeout).not.toHaveBeenCalled();

    jest.advanceTimersByTime(timeoutMs);
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });
});
