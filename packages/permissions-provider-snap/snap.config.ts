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

const config: SnapConfig = {
  bundler: 'webpack',
  input: resolve(__dirname, 'src/index.ts'),
  server: {
    port: 8081,
  },
  polyfills: {
    buffer: true,
    crypto: true,
  },
  environment: {
    SNAP_ENV: process.env.SNAP_ENV,
    PRICE_API_BASE_URL: process.env.PRICE_API_BASE_URL,
    USE_EOA_ACCOUNT: process.env.USE_EOA_ACCOUNT,
  },
};

export default config;
