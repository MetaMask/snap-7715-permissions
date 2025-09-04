/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-restricted-globals */

import type { SnapManifest } from '@metamask/7715-permissions-shared/types';

const snapEnv = process.env.SNAP_ENV ?? 'production';
const kernelSnapId =
  process.env.KERNEL_SNAP_ID ?? 'npm:@metamask/permissions-kernel-snap';

const manifest: SnapManifest = {
  version: '0.2.1',
  description: 'Grants 7715 permissions from a DeleGator smart account',
  proposedName: 'Gator Permissions',
  repository: {
    type: 'git',
    url: 'https://github.com/MetaMask/snap-7715-permissions.git',
  },
  source: {
    shasum: 'tQRss8KLZ2+OlG2QQyH81XYBcTLsWUzYXf/Xy0cHZsk=',
    location: {
      npm: {
        filePath: 'dist/bundle.js',
        iconPath: 'images/icon.svg',
        packageName: '@metamask/gator-permissions-snap',
        registry: 'https://registry.npmjs.org/',
      },
    },
  },
  initialConnections:
    snapEnv === 'local' || snapEnv === 'development'
      ? {
          [kernelSnapId]: {},
          'local:http://localhost:8081': {},
        }
      : {
          [kernelSnapId]: {},
        },
  initialPermissions: {
    'endowment:rpc': {
      dapps: false,
      snaps: true,
    },
    snap_manageState: {},
    'endowment:ethereum-provider': {},
    'endowment:network-access': {},
    snap_dialog: {},
    'endowment:lifecycle-hooks': {},
    snap_getPreferences: {},
  },
  platformVersion: '8.1.0',
  manifestVersion: '0.1',
};

export default manifest;
