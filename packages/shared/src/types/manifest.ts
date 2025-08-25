/* eslint-disable @typescript-eslint/naming-convention */
/**
 * Snap manifest type definitions based on the Snap manifest structure.
 */

/**
 * Repository information for the snap.
 */
export type SnapManifestRepository = {
  type: string;
  url: string;
};

/**
 * NPM location details for the snap source.
 */
export type SnapManifestNpmLocation = {
  filePath: string;
  iconPath: string;
  packageName: string;
  registry: string;
};

/**
 * Source location for the snap.
 */
export type SnapManifestLocation = {
  npm: SnapManifestNpmLocation;
};

/**
 * Source information for the snap.
 */
export type SnapManifestSource = {
  shasum: string;
  location: SnapManifestLocation;
};

/**
 * RPC endowment permission configuration.
 */
export type EndowmentRpcPermission = {
  dapps?: boolean;
  snaps?: boolean;
};

/**
 * Initial connections configuration.
 */
export type SnapManifestInitialConnections = Record<
  string,
  Record<string, unknown>
>;

/**
 * Initial permissions configuration.
 */
export type SnapManifestInitialPermissions = {
  'endowment:rpc'?: EndowmentRpcPermission;
  snap_manageState?: Record<string, unknown>;
  'endowment:ethereum-provider'?: Record<string, unknown>;
  'endowment:network-access'?: Record<string, unknown>;
  snap_dialog?: Record<string, unknown>;
  'endowment:lifecycle-hooks'?: Record<string, unknown>;
  snap_getPreferences?: Record<string, unknown>;
  snap_getEntropy?: Record<string, unknown>;
  'endowment:page-home'?: Record<string, unknown>;
  [key: string]: unknown;
};

/**
 * Complete Snap manifest structure.
 */
export type SnapManifest = {
  version: string;
  description: string;
  proposedName: string;
  repository: SnapManifestRepository;
  source: SnapManifestSource;
  initialConnections?: SnapManifestInitialConnections;
  initialPermissions: SnapManifestInitialPermissions;
  platformVersion: string;
  manifestVersion: string;
};
