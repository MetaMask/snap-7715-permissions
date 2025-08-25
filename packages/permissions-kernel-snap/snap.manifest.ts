import { defineSnapManifest } from '@metamask/7715-permissions-shared/utils';

// eslint-disable-next-line no-restricted-globals
const snapEnv = process.env.SNAP_ENV ?? 'production';

const manifest = defineSnapManifest({
  version: '0.2.0',
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
      snaps: true,
    },
  },
  platformVersion: '8.1.0',
  manifestVersion: '0.1',
});

if (snapEnv === 'local' || snapEnv === 'development') {
  // No initial connections in production - kernel initiates all
  manifest.initialConnections = {
    'local:http://localhost:8082': {},
    'npm:@metamask/gator-permissions-snap': {},
  };
}

export default manifest;
