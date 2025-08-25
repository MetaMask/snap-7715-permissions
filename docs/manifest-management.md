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
2. The shared `generate-snap-manifest` command (provided by `@metamask/7715-permissions-shared`) compiles and executes the TypeScript file to generate `snap.manifest.json`
3. The build/start commands automatically run this generation command

## Available Commands

### From individual snap packages:
```bash
# Generate manifest for current package
yarn generate-snap-manifest .

# Build with manifest generation
yarn build

# Start with manifest generation
yarn start
```

### From root directory:
```bash
# Generate manifest for specific package
yarn generate-snap-manifest packages/gator-permissions-snap
yarn generate-snap-manifest packages/permissions-kernel-snap

# With environment variable
SNAP_ENV=development yarn generate-snap-manifest packages/gator-permissions-snap
```

## File Structure

```
packages/
├── shared/
│   └── src/
│       └── scripts/
│           └── generate-manifest.js  # Shared manifest generation script
├── gator-permissions-snap/
│   ├── snap.manifest.ts              # TypeScript manifest definition (source of truth)
│   └── snap.manifest.json           # Generated from .ts file (git ignored)
└── permissions-kernel-snap/
    ├── snap.manifest.ts              # TypeScript manifest definition (source of truth)
    └── snap.manifest.json           # Generated from .ts file (git ignored)
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

## Migration from Previous Approach

If migrating from individual scripts to the shared approach:

1. Remove individual `scripts/generate-manifest.js` files from snap packages
2. Update `package.json` scripts to use `yarn generate-snap-manifest .`
3. Run `yarn install` to link the shared package
4. Test both development and production builds
