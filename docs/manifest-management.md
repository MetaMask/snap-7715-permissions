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
| `local` | Adds localhost:8081 | Adds localhost:8082 + gator snap |
| `production` (default) | Only kernel snap connection | No connections |


## How It Works

1. Each snap has `scripts/update-manifest.js` that modifies `snap.manifest.json` based on `SNAP_ENV`
2. The build/start commands automatically run this script
3. Connections are added/removed based on environment
4. The script also removes deprecated permissions

## CI/CD Example

```yaml
- name: Build for production
  env:
    SNAP_ENV: production
  run: yarn build
```
