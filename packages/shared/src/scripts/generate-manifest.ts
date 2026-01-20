#!/usr/bin/env node
/* eslint-disable import-x/no-unassigned-import */
/* eslint-disable import-x/no-nodejs-modules */
/* eslint-disable no-restricted-globals */

import { access, writeFile } from 'fs/promises';
import { join, resolve } from 'path';
import 'dotenv/config';

import type { SnapManifest } from '../types/manifest';

/**
 * Generates snap.manifest.json from the TypeScript manifest file.
 * @param packageDir - The directory of the package for which to generate the manifest.
 */
async function generateManifest(packageDir: string): Promise<void> {
  // Resolve the package directory to an absolute path
  const resolvedPackageDir = resolve(packageDir);
  const targetPath = join(resolvedPackageDir, 'snap.manifest.json');
  const tsPath = join(resolvedPackageDir, 'snap.manifest.ts');

  try {
    // Check if TypeScript manifest exists
    try {
      await access(tsPath);
    } catch {
      throw new Error(`TypeScript manifest not found: ${tsPath}`);
    }

    // Dynamically import the TS manifest using tsx runtime
    const moduleNamespace = await import(tsPath);
    const manifestFromModule =
      (moduleNamespace as { default?: unknown }).default ?? moduleNamespace;
    const manifest: SnapManifest = manifestFromModule as SnapManifest;

    // Write the manifest to snap.manifest.json
    await writeFile(
      targetPath,
      `${JSON.stringify(manifest, null, 2)}\n`,
      'utf8',
    );

    console.log(
      `✅ Generated ${targetPath} (${process.env.SNAP_ENV ?? 'production'})`,
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Failed to generate manifest:', errorMessage);

    process.exit(1);
  }
}

// Get package directory from command line arguments
const packageDir = process.argv[2];

if (!packageDir) {
  console.error('❌ Error: Package directory is required');
  console.error('Usage: generate-manifest.ts <package-directory>');
  process.exit(1);
}

// Run the manifest generation
(async (): Promise<void> => {
  await generateManifest(packageDir);
})().catch((error: unknown) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
