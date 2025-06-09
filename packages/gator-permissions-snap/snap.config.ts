/* eslint-disable n/no-process-env */
import { type SnapConfig } from '@metamask/snaps-cli';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config();

const {
  SNAP_ENV,
  PRICE_API_BASE_URL,
  STORE_PERMISSIONS_ENABLED,
  USE_EOA_ACCOUNT,
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

if (!USE_EOA_ACCOUNT) {
  throw new Error(
    'STORE_PERMISSIONS_ENABLED must be set as an environment variable.',
  );
}

if (USE_EOA_ACCOUNT !== 'true' && USE_EOA_ACCOUNT !== 'false') {
  throw new Error(
    'USE_EOA_ACCOUNT must be set as an environment variable and must be set to "true" or "false".',
  );
}

const config: SnapConfig = {
  bundler: 'webpack',
  input: resolve(__dirname, 'src/index.ts'),
  server: {
    port: 8082,
  },
  polyfills: {
    buffer: true,
  },
  environment: {
    SNAP_ENV,
    PRICE_API_BASE_URL,
    STORE_PERMISSIONS_ENABLED,
    USE_EOA_ACCOUNT,
  },
};

export default config;
