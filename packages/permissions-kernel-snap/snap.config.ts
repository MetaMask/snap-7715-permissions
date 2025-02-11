import type { SnapConfig } from '@metamask/snaps-cli';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config();

// eslint-disable-next-line n/no-process-env
if (!process.env.SNAP_ENV) {
  throw new Error('SNAP_ENV must be set as an environment variable.');
}

const config: SnapConfig = {
  bundler: 'webpack',
  input: resolve(__dirname, 'src/index.tsx'),
  server: {
    port: 8080,
  },
  polyfills: {
    buffer: true,
  },
  environment: {
    // eslint-disable-next-line n/no-process-env
    SNAP_ENV: process.env.SNAP_ENV,
  },
};

export default config;
