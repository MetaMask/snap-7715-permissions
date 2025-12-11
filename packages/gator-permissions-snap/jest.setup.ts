import dotenv from 'dotenv';

dotenv.config();

// Mock toLocaleString to use consistent 'en-US' locale for deterministic test snapshots
// eslint-disable-next-line @typescript-eslint/unbound-method
const originalToLocaleString = Date.prototype.toLocaleString;
// eslint-disable-next-line no-extend-native
Date.prototype.toLocaleString = function (
  locales?: string | string[],
  options?: Intl.DateTimeFormatOptions,
) {
  return originalToLocaleString.call(this, locales ?? 'en-US', options);
};
