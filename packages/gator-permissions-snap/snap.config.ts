/* eslint-disable n/no-process-env */
import { type SnapConfig } from '@metamask/snaps-cli';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config();

const {
  SNAP_ENV,
  PRICE_API_BASE_URL,
  STORE_PERMISSIONS_ENABLED,
  ACCOUNT_API_BASE_URL,
  SUPPORTED_CHAINS,
} = process.env;

if (!SNAP_ENV) {
  throw new Error('SNAP_ENV must be set as an environment variable.');
}

if (!PRICE_API_BASE_URL) {
  throw new Error('PRICE_API_BASE_URL must be set as an environment variable.');
}

if (!STORE_PERMISSIONS_ENABLED) {
  throw new Error(
    'STORE_PERMISSIONS_ENABLED must be set as an environment variable.',
  );
}

if (
  STORE_PERMISSIONS_ENABLED !== 'true' &&
  STORE_PERMISSIONS_ENABLED !== 'false'
) {
  throw new Error(
    'STORE_PERMISSIONS_ENABLED must be set as an environment variable and must be set to "true" or "false".',
  );
}

if (!ACCOUNT_API_BASE_URL) {
  throw new Error(
    'ACCOUNT_API_BASE_URL must be set as an environment variable.',
  );
}

if (!SUPPORTED_CHAINS) {
  throw new Error('SUPPORTED_CHAINS must be set as an environment variable.');
}

const config: SnapConfig = {
  input: resolve(__dirname, 'src/index.ts'),
  server: {
    port: 8082,
  },
  polyfills: {
    buffer: true,
    crypto: true,
  },
  environment: {
    SNAP_ENV,
    PRICE_API_BASE_URL,
    STORE_PERMISSIONS_ENABLED,
    ACCOUNT_API_BASE_URL,
    SUPPORTED_CHAINS,
  },
};

export default config;
