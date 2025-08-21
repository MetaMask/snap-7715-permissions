/* eslint-disable n/no-process-exit */
/* eslint-disable n/no-sync */
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Updates the snap.manifest.json based on SNAP_ENV environment variable.
 * - local: Adds localhost connections for development
 * - production: Removes all connections (kernel snap initiates all connections)
 */
function updateManifest() {
  const manifestPath = path.join(__dirname, '..', 'snap.manifest.json');
  // eslint-disable-next-line n/no-process-env
  const env = process.env.SNAP_ENV || 'production';

  try {
    // Read the current manifest
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);

    if (env === 'local') {
      // Add connections for local development
      if (!manifest.initialConnections) {
        manifest.initialConnections = {};
      }
      manifest.initialConnections['local:http://localhost:8082'] = {};
      manifest.initialConnections['npm:@metamask/gator-permissions-snap'] = {};

      console.log('✅ Updated snap.manifest.json for local environment');
      console.log('   - Added localhost:8082 connection');
      console.log('   - Added gator-permissions-snap connection');
    } else if (env === 'production') {
      // Remove all initialConnections for production
      // as all communication is initiated by the kernel snap
      delete manifest.initialConnections;

      console.log('✅ Updated snap.manifest.json for production environment');
      console.log(
        '   - Removed all initialConnections (kernel initiates all connections)',
      );
    } else {
      console.warn(
        `⚠️  Unknown SNAP_ENV value: ${env}. Using production configuration.`,
      );
      delete manifest.initialConnections;
    }

    // Write the updated manifest
    fs.writeFileSync(
      manifestPath,
      `${JSON.stringify(manifest, null, 2)}\n`,
      'utf8',
    );
  } catch (error) {
    console.error('❌ Failed to update manifest:', error.message);
    process.exit(1);
  }
}

// Run the update
updateManifest();
