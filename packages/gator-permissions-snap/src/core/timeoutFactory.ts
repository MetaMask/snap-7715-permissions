export type Timeout = {
  cancel: () => void;
};

export type TimeoutFactory = {
  register: (config: { onTimeout: () => void | Promise<void> }) => Timeout;
};

/**
 * Creates a timeout factory.
 * @param config - The configuration for the timeout factory.
 * @param config.timeoutMs - The timeout in milliseconds.
 * @returns A timeout factory that can be used to register timeouts.
 */
export function createTimeoutFactory({ timeoutMs }: { timeoutMs: number }) {
  const register = (config: { onTimeout: () => void }) => {
    const timeout = setTimeout(() => {
      config.onTimeout();
    }, timeoutMs);

    return {
      cancel: () => clearTimeout(timeout),
    };
  };

  return {
    register,
  };
}
