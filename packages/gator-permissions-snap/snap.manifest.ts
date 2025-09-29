/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-restricted-globals */

import type { SnapManifest } from '@metamask/7715-permissions-shared/types';

const kernelSnapId = process.env.KERNEL_SNAP_ID;
const messageSnapId = process.env.MESSAGE_SIGNING_SNAP_ID;
const snapEnv = process.env.SNAP_ENV;
const manifest: SnapManifest = {
  version: '0.3.0',
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
  initialPermissions: {
    'endowment:rpc': {
      dapps: false,
      snaps: true,
    },
    snap_manageState: {},
    'endowment:ethereum-provider': {},
    'endowment:network-access': {},
    snap_dialog: {},
    snap_getPreferences: {},
  },
  platformVersion: '8.1.0',
  manifestVersion: '0.1',
};

if (kernelSnapId) {
  manifest.initialConnections = {
    ...(kernelSnapId ? { [kernelSnapId]: {} } : {}),
    ...(messageSnapId ? { [messageSnapId]: {} } : {}),
  };
}

if (snapEnv === 'local') {
  // Grant lifecycle hooks permission in local development environment
  manifest.initialPermissions['endowment:lifecycle-hooks'] = {};
}

export default manifest;
