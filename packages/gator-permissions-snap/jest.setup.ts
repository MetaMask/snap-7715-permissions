import dotenv from 'dotenv';

import { setupI18n } from './src/utils/i18n';

dotenv.config();

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
