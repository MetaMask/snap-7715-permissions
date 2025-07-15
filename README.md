# 7715 Permissions Snap Monorepo

### Getting Started

1. **Fork the repository**:

   - Click the "Fork" button at the top right of the repository page.

2. **Clone your fork**:
   ```shell
   git clone https://github.com/<your-username>/snap-7715-permissions.git
   ```
3. **Create Working Branch**:
   ```shell
   git checkout -b feat/example-branch
   ```

## Overview

This mono-repository contains the `@metamask/permissions-kernel-snap` and `@metamask/gator-permissions-snap` that implement ERC-7715 and the Permissions registry. dApps may request a permission via the exposed JSON-RPC interface. A user can grant granular permissions as cryptographic capabilities to allow dApps to execute transactions on their behalf.

### @metamask/permissions-kernel-snap

This Snap manages a `permissions offer registry`, which lists all the permissions a user is willing to grant via a [ERC-7715](https://eip.tools/eip/7715) permissions request. When a dApp makes a 7715 request to the kernel, the kernel forwards it to a permissions provider Snap for user review and attenuation. If the dApp requests any permission not listed in the registry, the kernel automatically rejects the request.

### @metamask/gator-permissions-snap

This Snap creates a [DeleGator account](https://github.com/MetaMask/delegation-framework) and enables the site to request [ERC-7715](https://eip.tools/eip/7715) permissions from that account. Users can review and adjust the granted permissions through a custom interactive confirmation dialog rendered by the Snap.

[Read more on "@metamask/gator-permissions-snap" ->](/packages/gator-permissions-snap/ARCHITECTURE.md)

## Development

**Prerequisites**

- [MetaMask Flask >= 12.14.2](https://docs.metamask.io/snaps/get-started/install-flask/)
- Nodejs `20.0.0` or > `22.0.0` (specified in `.nvmrc`)
- yarn 3.2.1

### Environment variables

#### site

The snap origin to use(defaults to local if not defined): `./packages/site/.env`. Local development values can be found in [./packages/site/.env.example](/packages/site/.env.example).

#### @metamask/permissions-kernel-snap

The snap will throw errors during build process if values are not defined: `./packages/permissions-kernel-snap/.env`. Development values can be found in [./packages/permissions-kernel-snap/.env.example](/packages/permissions-kernel-snap/.env.example).


#### @metamask/gator-permissions-snap

The snap will throw errors during build process if values are not defined: `./packages/gator-permissions-snap/.env`. Development values can be found in [./packages/gator-permissions-snap/.env.example](/packages/gator-permissions-snap/.env.example).

### Running snaps

Ensure the appropriate environment variables values are set:

- `./packages/permissions-kernel-snap/.env`
- `./packages/gator-permissions-snap/.env`
- `./packages/site/.env`

#### `STORE_PERMISSIONS_ENABLED=false` or removed from `.env`

```shell
# Install dependencies and sets up submodule
yarn prepare:snap

# Starts local @metamask/permissions-kernel-snap and @metamask/gator-permissions-snap
yarn start
```

The development site will start up on `http://localhost:8000/`

- `@metamask/permissions-kernel-snap`is served from `local:http://localhost:8081`
- `@metamask/gator-permissions-snap` is served from `local:http://localhost:8082`

#### `STORE_PERMISSIONS_ENABLED=true` to test storage features

```shell
# Install dependencies and sets up submodule
yarn prepare:snap

# Starts local @metamask/message-signing-snap
yarn start:message-signing-snap

# In new terminal window, start local @metamask/permissions-kernel-snap and @metamask/gator-permissions-snap
yarn start
```

The development site will start up on `http://localhost:8000/`

- `@metamask/message-signing-snap` is served from `local:http://localhost:8080`
- `@metamask/permissions-kernel-snap`is served from `local:http://localhost:8081`
- `@metamask/gator-permissions-snap` is served from `local:http://localhost:8082`

### Testing

> **Note**: `@metamask/snaps-jest` assumes that the snap is built in the
> directory you're running Jest from. If you're using a different directory,
> you can specify the path to the snap using the [`root`](#options) option, or
> by running your own HTTP server.
>
> Right now it's not possible to use `@metamask/snaps-jest` with a snap that
> isn't built.

Ensure the appropriate environment variables values are set:

- `./packages/permissions-kernel-snap/.env`
- `./packages/gator-permissions-snap/.env`

```bash
yarn build

yarn test
```

### Linting

To run the linter.

```bash
yarn lint
```

To run the linter and fix any automatically fixable issues.

```bash
yarn lint:fix
```

### Using NPM packages with scripts

Scripts are disabled by default for security reasons. If you need to use NPM
packages with scripts, you can run `yarn allow-scripts auto`, and enable the
script in the `lavamoat.allowScripts` section of `package.json`.

See the documentation for [@lavamoat/allow-scripts](https://github.com/LavaMoat/LavaMoat/tree/main/packages/allow-scripts)
for more information.

## Relevant Documents

- [ERC-7715](https://eip.tools/eip/7715)
- [ERC-7710](https://eip.tools/eip/7710)
