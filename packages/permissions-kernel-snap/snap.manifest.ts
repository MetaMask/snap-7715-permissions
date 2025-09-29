/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-restricted-globals */
import type { SnapManifest } from '@metamask/7715-permissions-shared/types';

const gatorSnapId = process.env.GATOR_PERMISSIONS_PROVIDER_SNAP_ID;

const manifest: SnapManifest = {
  version: '0.3.0',
  description: 'Manage onchain 7715 permissions',
  proposedName: 'MetaMask Permissions Kernel',
  repository: {
    type: 'git',
    url: 'https://github.com/MetaMask/snap-7715-permissions.git',
  },
  source: {
    shasum: '2qk+5LT6qXaTxoZfoZrNG7jWF4IhqgyaY0GZ50qYeMM=',
    location: {
      npm: {
        filePath: 'dist/bundle.js',
        iconPath: 'images/icon.svg',
        packageName: '@metamask/permissions-kernel-snap',
        registry: 'https://registry.npmjs.org/',
      },
    },
  },
  initialPermissions: {
    'endowment:rpc': {
      dapps: true,
      snaps: false,
    },
  },
  platformVersion: '8.1.0',
  manifestVersion: '0.1',
};

if (gatorSnapId) {
  manifest.initialConnections = {
    [gatorSnapId]: {},
  };
}

export default manifest;
