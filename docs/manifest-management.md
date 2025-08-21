# Manifest Management Guide

This guide explains how development and production manifests are managed for the 7715 permissions snaps using the `SNAP_ENV` environment variable.

## Overview

The snaps use different manifest configurations based on the `SNAP_ENV` environment variable:
- **`SNAP_ENV=production`** (default): Minimal permissions and connections for production
- **`SNAP_ENV=local`**: Additional localhost connections for local development

## Environment-Based Configuration

### Gator Permissions Snap

**Production (`SNAP_ENV=production`):**
- Only connection to `npm:@metamask/permissions-kernel-snap`
- No `snap_getEntropy` permission (removed as unnecessary)
- No localhost connections

**Local Development (`SNAP_ENV=local`):**
- Adds `local:http://localhost:8081` connection for local testing
- Retains `npm:@metamask/permissions-kernel-snap` connection

### Permissions Kernel Snap

**Production (`SNAP_ENV=production`):**
- No `initialConnections` (all communication is initiated by the kernel snap)
- No `snap_dialog` permission (removed as unnecessary)

**Local Development (`SNAP_ENV=local`):**
- Adds `local:http://localhost:8082` connection for local testing
- Adds `npm:@metamask/gator-permissions-snap` connection (for development convenience)

## Usage

### Local Development

Set `SNAP_ENV=local` in your `.env` file or use it directly in commands:

```bash
# Using .env file (recommended)
echo "SNAP_ENV=local" > .env

# Then run normally
cd packages/gator-permissions-snap
yarn start    # or yarn build

# Or set inline
SNAP_ENV=local yarn start
```

### Production Build

For production builds, either:
- Don't set `SNAP_ENV` (defaults to production)
- Explicitly set `SNAP_ENV=production`

```bash
# Default (production)
cd packages/gator-permissions-snap
yarn build

# Or explicit
SNAP_ENV=production yarn build
```

## Implementation Details

Each snap has a `scripts/update-manifest.js` script that:
1. Reads the `SNAP_ENV` environment variable (defaults to 'production')
2. Updates `snap.manifest.json` based on the environment
3. Adds/removes connections appropriately

The package.json scripts automatically run this before building:
- `build` - Runs `update-manifest.js` then builds
- `start` - Runs `update-manifest.js` then watches

## Environment Variable Reference

| Value | Description | Gator Snap | Kernel Snap |
|-------|-------------|------------|-------------|
| `local` | Local development | Adds localhost:8081 | Adds localhost:8082 and gator snap |
| `production` | Production build (default) | Only kernel snap connection | No connections |
| Other/Unset | Defaults to production | Production config | Production config |

## CI/CD Integration

For CI/CD pipelines, ensure the appropriate environment is set:

```yaml
# GitHub Actions example
- name: Build for production
  env:
    SNAP_ENV: production
  run: yarn build

# Or for staging/test environments
- name: Build for staging
  env:
    SNAP_ENV: local
  run: yarn build
```
