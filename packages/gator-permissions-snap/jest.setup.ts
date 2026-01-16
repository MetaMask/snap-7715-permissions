import { config } from 'dotenv';
import { setupI18n } from './src/utils/i18n';

config();

// Mock snap global for i18n
export const mockSnapGlobal = (locale = 'en') => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).snap = {
    request: jest.fn().mockResolvedValue({ locale }),
  };
};

mockSnapGlobal();

// Initialize i18n before all tests
beforeAll(async () => {
  await setupI18n();
});

// Mock toLocaleString to use consistent 'en-US' locale for deterministic test snapshots
// eslint-disable-next-line @typescript-eslint/unbound-method
const originalToLocaleString = Date.prototype.toLocaleString;
// eslint-disable-next-line no-extend-native
Date.prototype.toLocaleString = function (
  locales?: string | string[],
  options?: Intl.DateTimeFormatOptions,
): string {
  return originalToLocaleString.call(this, locales ?? 'en-US', options);
};
