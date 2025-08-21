/* eslint-disable n/no-process-exit */
/* eslint-disable n/no-sync */
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Updates the snap.manifest.json file based on the SNAP_ENV environment variable.
 * - local: Adds localhost connections for development.
 * - production: Uses minimal connections for production.
 */
function updateManifest() {
  const manifestPath = path.join(__dirname, '..', 'snap.manifest.json');
  // eslint-disable-next-line n/no-process-env
  const env = process.env.SNAP_ENV || 'production';

  try {
    // Read the current manifest
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);

    // Always ensure the kernel snap connection is present
    if (!manifest.initialConnections) {
      manifest.initialConnections = {};
    }
    manifest.initialConnections['npm:@metamask/permissions-kernel-snap'] = {};

    if (env === 'local') {
      // Add localhost connection for local development
      manifest.initialConnections['local:http://localhost:8081'] = {};
      console.log('✅ Updated snap.manifest.json for local environment');
      console.log('   - Added localhost:8081 connection');
    } else if (env === 'production') {
      // Remove localhost connection for production
      delete manifest.initialConnections['local:http://localhost:8081'];
      console.log('✅ Updated snap.manifest.json for production environment');
      console.log('   - Removed localhost connections');
    } else {
      console.warn(
        `⚠️  Unknown SNAP_ENV value: ${env}. Using production configuration.`,
      );
      delete manifest.initialConnections['local:http://localhost:8081'];
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
