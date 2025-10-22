/* eslint-disable n/no-process-env */
import { type SnapConfig } from '@metamask/snaps-cli';
import { InternalError } from '@metamask/snaps-sdk';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config();

const {
  SNAP_ENV,
  PRICE_API_BASE_URL,
  STORE_PERMISSIONS_ENABLED,
  ACCOUNT_API_BASE_URL,
  TOKENS_API_BASE_URL,
  KERNEL_SNAP_ID,
  MESSAGE_SIGNING_SNAP_ID,
  SUPPORTED_CHAIN_IDS,
} = process.env;

if (!SNAP_ENV) {
  throw new InternalError('SNAP_ENV must be set as an environment variable.');
}

if (!KERNEL_SNAP_ID) {
  throw new InternalError(
    'KERNEL_SNAP_ID must be set as an environment variable.',
  );
}

if (!MESSAGE_SIGNING_SNAP_ID) {
  throw new InternalError(
    'MESSAGE_SIGNING_SNAP_ID must be set as an environment variable.',
  );
}

if (!PRICE_API_BASE_URL) {
  throw new InternalError(
    'PRICE_API_BASE_URL must be set as an environment variable.',
  );
}

if (!STORE_PERMISSIONS_ENABLED) {
  throw new InternalError(
    'STORE_PERMISSIONS_ENABLED must be set as an environment variable.',
  );
}

if (
  STORE_PERMISSIONS_ENABLED !== 'true' &&
  STORE_PERMISSIONS_ENABLED !== 'false'
) {
  throw new InternalError(
    'STORE_PERMISSIONS_ENABLED must be set as an environment variable and must be set to "true" or "false".',
  );
}

if (!ACCOUNT_API_BASE_URL) {
  throw new InternalError(
    'ACCOUNT_API_BASE_URL must be set as an environment variable.',
  );
}

if (!TOKENS_API_BASE_URL) {
  throw new InternalError(
    'TOKENS_API_BASE_URL must be set as an environment variable.',
  );
}

if (!SUPPORTED_CHAIN_IDS) {
  throw new InternalError(
    'SUPPORTED_CHAIN_IDS must be set as an environment variable.',
  );
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
    TOKENS_API_BASE_URL,
    KERNEL_SNAP_ID,
    MESSAGE_SIGNING_SNAP_ID,
    SUPPORTED_CHAIN_IDS,
  },
};

export default config;
