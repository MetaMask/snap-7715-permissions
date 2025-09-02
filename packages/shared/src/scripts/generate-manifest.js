#!/usr/bin/env node
/* eslint-disable n/no-process-env */
/* eslint-disable n/no-process-exit */
/* eslint-disable n/no-sync */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Generates snap.manifest.json from the TypeScript manifest file.
 * @param {string} packageDir - The directory of the package for which to generate the manifest.
 * @returns {void}
 */
function generateManifest(packageDir) {
  if (!packageDir) {
    console.error('❌ Error: Package directory is required');
    console.error('Usage: generate-manifest.js <package-directory>');
    process.exit(1);
  }

  // Resolve the package directory to an absolute path
  const resolvedPackageDir = path.resolve(packageDir);
  const targetPath = path.join(resolvedPackageDir, 'snap.manifest.json');
  const tsPath = path.join(resolvedPackageDir, 'snap.manifest.ts');

  try {
    // Check if TypeScript manifest exists
    if (!fs.existsSync(tsPath)) {
      throw new Error(`TypeScript manifest not found: ${tsPath}`);
    }

    // Use tsx to execute the TypeScript file and get the manifest
    // tsx handles TypeScript execution without separate compilation
    const manifestJson = execSync(
      `SNAP_ENV="${process.env.SNAP_ENV || 'production'}" npx tsx -e "
        const manifest = require('${tsPath.replace(/\\/gu, '\\\\').replace(/'/gu, "\\'")}').default;
        console.log(JSON.stringify(manifest, null, 2));
      "`,
      {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        env: Object.assign({}, process.env, {
          NODE_OPTIONS: '--no-warnings',
        }),
        cwd: resolvedPackageDir,
      },
    );

    // Parse the output
    const manifest = JSON.parse(manifestJson);

    // Write the manifest to snap.manifest.json
    fs.writeFileSync(
      targetPath,
      `${JSON.stringify(manifest, null, 2)}\n`,
      'utf8',
    );

    console.log(
      `✅ Generated ${targetPath} (${process.env.SNAP_ENV || 'production'})`,
    );
  } catch (error) {
    console.error('❌ Failed to generate manifest:', error.message);

    // If the error output contains useful info, show it
    if (error.stderr) {
      console.error(error.stderr.toString());
    }

    process.exit(1);
  }
}

// Get package directory from command line arguments
const packageDir = process.argv[2];

// Run the manifest generation
generateManifest(packageDir);
