import { type SnapConfig } from '@metamask/snaps-cli';
import { InternalError } from '@metamask/snaps-sdk';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config();

// eslint-disable-next-line n/no-process-env
const { SNAP_ENV, GATOR_PERMISSIONS_PROVIDER_SNAP_ID } = process.env;

if (!SNAP_ENV) {
  throw new InternalError('SNAP_ENV must be set as an environment variable.');
}

if (!GATOR_PERMISSIONS_PROVIDER_SNAP_ID) {
  throw new InternalError(
    'GATOR_PERMISSIONS_PROVIDER_SNAP_ID must be set as an environment variable.',
  );
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
    SNAP_ENV,
    GATOR_PERMISSIONS_PROVIDER_SNAP_ID,
  },
};

export default config;
