import { logger } from '@metamask/7715-permissions-shared/utils';

export type Timeout = {
  cancel: () => void;
};

export type TimeoutFactory = {
  register: (config: { onTimeout: () => Promise<void> }) => Timeout;
};

/**
 * Creates a timeout factory.
 * @param config - The configuration for the timeout factory.
 * @param config.timeoutMs - The timeout in milliseconds.
 * @returns A timeout factory that can be used to register timeouts.
 */
export function createTimeoutFactory({
  timeoutMs,
}: {
  timeoutMs: number;
}): TimeoutFactory {
  const register = (config: { onTimeout: () => Promise<void> }): Timeout => {
    const timeout = setTimeout(() => {
      config.onTimeout().catch((error: Error) => {
        logger.error('Error in timeout callback:', error);
      });
    }, timeoutMs);

    return {
      cancel: (): void => clearTimeout(timeout),
    };
  };

  return {
    register,
  };
}
