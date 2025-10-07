/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-restricted-globals */
import type { SnapManifest } from '@metamask/7715-permissions-shared/types';

// eslint-disable-next-line import/no-relative-packages
import packageJson from './package.json' with { type: 'json' };

const manifest: SnapManifest = {
  version: packageJson.version,
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

export default manifest;
