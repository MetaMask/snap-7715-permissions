/* eslint-disable n/no-process-env */
import { type SnapConfig } from '@metamask/snaps-cli';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config();

if (!process.env.SNAP_ENV) {
  throw new Error('SNAP_ENV must be set as an environment variable.');
}

if (!process.env.PRICE_API_BASE_URL) {
  throw new Error('PRICE_API_BASE_URL must be set as an environment variable.');
}

if (!process.env.AUTO_STORE_PERMISSIONS) {
  throw new Error(
    'AUTO_STORE_PERMISSIONS must be set as an environment variable.',
  );
}

if (
  process.env.AUTO_STORE_PERMISSIONS !== 'true' &&
  process.env.AUTO_STORE_PERMISSIONS !== 'false'
) {
  throw new Error('AUTO_STORE_PERMISSIONS must be set to true or false.');
}

const config: SnapConfig = {
  bundler: 'webpack',
  input: resolve(__dirname, 'src/index.ts'),
  server: {
    port: 8082,
  },
  polyfills: {
    buffer: true,
    crypto: true,
  },
  environment: {
    SNAP_ENV: process.env.SNAP_ENV,
    PRICE_API_BASE_URL: process.env.PRICE_API_BASE_URL,
    AUTO_STORE_PERMISSIONS: process.env.AUTO_STORE_PERMISSIONS,
  },
};

export default config;
