# Manifest Management Guide

The 7715 permissions snaps use environment-based manifest configuration via `SNAP_ENV`.

## Quick Start

### Local Development
```bash
# Set environment
echo "SNAP_ENV=local" > .env

# Build or start
yarn start
```

### Production Build
```bash
# Default is production
yarn build

# Or explicit
SNAP_ENV=production yarn build
```

## Configuration

| Environment | Gator Snap | Kernel Snap |
|------------|------------|-------------|
| `local`/`development` | Adds localhost:8081 | Adds localhost:8082 + gator snap |
| `production` (default) | Only kernel snap connection | No connections |


## How It Works

1. Each snap has a `snap.manifest.ts` file that defines the manifest using the `defineSnapManifest` helper
2. The `scripts/generate-manifest.js` script compiles and executes the TypeScript file to generate `snap.manifest.json`
3. The build/start commands automatically run this generation script


## File Structure

```
packages/
├── gator-permissions-snap/
│   ├── snap.manifest.ts              # TypeScript manifest definition (source of truth)
│   ├── snap.manifest.json           # Generated from .ts file (git ignored)
│   └── scripts/generate-manifest.js # Compiles .ts and generates .json
└── permissions-kernel-snap/
    ├── snap.manifest.ts              # TypeScript manifest definition (source of truth)
    ├── snap.manifest.json           # Generated from .ts file (git ignored)
    └── scripts/generate-manifest.js # Compiles .ts and generates .json
```

## Environment Variables

- `SNAP_ENV` - Controls which manifest template to use
  - `local` or `development` - Uses dev manifest
  - `production` (default) - Uses production manifest
  - Any other value - Falls back to production

## CI/CD Example

```yaml
- name: Build for production
  env:
    SNAP_ENV: production
  run: yarn build
```
