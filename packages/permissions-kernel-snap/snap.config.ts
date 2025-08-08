import { type SnapConfig } from '@metamask/snaps-cli';
import { InternalError } from '@metamask/snaps-sdk';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config();

// eslint-disable-next-line n/no-process-env
if (!process.env.SNAP_ENV) {
  throw new InternalError('SNAP_ENV must be set as an environment variable.');
}

const config: SnapConfig = {
  input: resolve(__dirname, 'src/index.ts'),
  server: {
    port: 8081,
  },
  polyfills: {
    buffer: true,
    crypto: true,
  },
  environment: {
    // eslint-disable-next-line n/no-process-env
    SNAP_ENV: process.env.SNAP_ENV,
  },
};

export default config;
