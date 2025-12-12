/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable no-restricted-globals */

import type { SnapManifest } from '@metamask/7715-permissions-shared/types';

// eslint-disable-next-line import/no-relative-packages
import packageJson from './package.json' with { type: 'json' };

const kernelSnapId = process.env.KERNEL_SNAP_ID;
const snapEnv = process.env.SNAP_ENV;
const manifest: SnapManifest = {
  version: packageJson.version,
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
  platformVersion: '10.2.0',
  manifestVersion: '0.1',
};

if (kernelSnapId) {
  manifest.initialConnections = {
    ...(kernelSnapId ? { [kernelSnapId]: {} } : {}),
  };
}

if (snapEnv === 'local') {
  /**
   * Grant lifecycle hooks permission in local development environment.
   *
   * The lifecycle hooks endowment is required to enable the onInstall handler
   * which automatically installs the message signing snap during local development.
   * This ensures that the gator permissions snap can establish the necessary
   * connection to the message signing snap for 7715 permissions functionality.
   *
   * In production environments, the message signing snap is pre-installed by
   * the MetaMask extension, making this endowment unnecessary and it's excluded
   * to minimize the snap's permission footprint.
   */
  manifest.initialPermissions['endowment:lifecycle-hooks'] = {};
}

export default manifest;
