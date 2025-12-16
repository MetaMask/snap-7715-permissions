import { createTimeoutFactory } from '../../src/core/timeoutFactory';

describe('createTimeoutFactory', () => {
  it('invokes onTimeout after the configured delay', () => {
    const onTimeout = jest.fn();
    const timeoutMs = 1000;
    const factory = createTimeoutFactory({ timeoutMs });

    let capturedCallback: (() => void) | undefined;
    // eslint-disable-next-line no-restricted-globals
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation(((
      handler: TimerHandler,
    ) => {
      capturedCallback = handler as () => void;
      // return a fake timer id
      return 1;
    }) as unknown as typeof setTimeout);

    const timeout = factory.register({ onTimeout });
    expect(onTimeout).not.toHaveBeenCalled();

    // Manually trigger the captured callback to simulate the timeout firing
    expect(typeof capturedCallback).toBe('function');
    capturedCallback?.();
    expect(onTimeout).toHaveBeenCalledTimes(1);

    // Cancel after firing should be a no-op but still be callable
    timeout.cancel();
    setTimeoutSpy.mockRestore();
  });

  it('does not invoke onTimeout if cancelled before the delay', () => {
    const onTimeout = jest.fn();
    const timeoutMs = 500;
    const factory = createTimeoutFactory({ timeoutMs });

    const fakeTimerId = 123 as unknown as NodeJS.Timeout;
    const setTimeoutSpy = jest
      // eslint-disable-next-line no-restricted-globals
      .spyOn(global, 'setTimeout')
      .mockImplementation(() => {
        return fakeTimerId;
      });

    const clearTimeoutSpy = jest
      // eslint-disable-next-line no-restricted-globals
      .spyOn(global, 'clearTimeout')
      .mockImplementation(() => undefined);

    const timeout = factory.register({ onTimeout });
    timeout.cancel();

    expect(onTimeout).not.toHaveBeenCalled();
    expect(clearTimeoutSpy).toHaveBeenCalledWith(fakeTimerId);

    // do not trigger captured callback since it would represent a fired timer
    setTimeoutSpy.mockRestore();
    clearTimeoutSpy.mockRestore();
  });

  it('returns an object with a cancel function', () => {
    const factory = createTimeoutFactory({ timeoutMs: 10 });
    const timeout = factory.register({ onTimeout: () => undefined });
    expect(typeof timeout.cancel).toBe('function');
  });
});
