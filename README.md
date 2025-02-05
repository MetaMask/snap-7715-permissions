# 7715 Permissions Snap Monorepo

This mono-repository contains the `kernel` and `gator` snaps that implement ERC-7715 and the Permissions registry. 
dApps send request the permissions request to the exposed JSON-RPC interface.
A user can grant granular permissions as cryptographic capabilities to allow dApps to execute transactions on their behalf.

## Prerequisites

- [MetaMask Flask](https://consensyssoftware.atlassian.net/wiki/x/IQCOB10)
- Nodejs `20.0.0` (specified in `.nvmrc`)
- yarn 3.2.1

## Environment variables

### site
The snap origin to use(defaults to local if not defined):
```bash
KERNEL_SNAP_ORIGIN=local:http://localhost:8080
GATOR_SNAP_ORIGIN=local:http://localhost:8081
```

### permissions-kernel-snap
- SNAP_ENV: The snap uses `SNAP_ENV` to dynamically map permission provider snapId to registered offers in the `PermissionOfferRegistry`. Please make use `SNAP_ENV=dev` before building the snap.

### permissions-provider-snap

- SNAP_ENV: The snap uses `SNAP_ENV` to dynamically set the kernel snap snapId

## Getting Started

Clone the [snap-7715-permissions repository](https://github.com/MetaMask/snap-7715-permissions) and set up the development environment:

1. Set the .env `SNAP_ENV=dev` in:
   - `./packages/permissions-kernel-snap/.env`
   - `./packages/permissions-provider-snap/.env`
2. Install and start up snaps with development site
```shell
yarn install && yarn start
```

The development site will start up on `http://localhost:8000/`

## Contributing

### Testing

> **Note**: `@metamask/snaps-jest` assumes that the snap is built in the
> directory you're running Jest from. If you're using a different directory,
> you can specify the path to the snap using the [`root`](#options) option, or
> by running your own HTTP server.
>
> Right now it's not possible to use `@metamask/snaps-jest` with a snap that
> isn't built.

1. Set the .env `SNAP_ENV=dev` in:
   - `./packages/permissions-kernel-snap/.env`
   - `./packages/permissions-provider-snap/.env`
2. Run `yarn build`
2. Run `yarn test` to run the tests once.

### Linting

Run `yarn lint` to run the linter, or run `yarn lint:fix` to run the linter and
fix any automatically fixable issues.

### Using NPM packages with scripts

Scripts are disabled by default for security reasons. If you need to use NPM
packages with scripts, you can run `yarn allow-scripts auto`, and enable the
script in the `lavamoat.allowScripts` section of `package.json`.

See the documentation for [@lavamoat/allow-scripts](https://github.com/LavaMoat/LavaMoat/tree/main/packages/allow-scripts)
for more information.

## Snaps Preinstall e2e with MetaMask extension
> :warning: **Tarball file will need to be generate locally as it is not pushed to remote repos. Follow steps below to create a tarball.**

The tarball will allow us to test preinstall on the public [metamask-extension branch](https://github.com/V00D00-child/metamask-extension) without exposing the snaps codebase to the public.

1. Update the .env `SNAP_ENV=prod` in:
   - `./packages/permissions-kernel-snap/.env`
   - `./packages/permissions-provider-snap/.env`
2. From root of repo run the following: 
```bash
mkdir deps
yarn build:pack
```

### Add preinstalls to mm-extension local build (mm-extension repo)

Follow these steps to build a local version of MetaMask with packed preinstalled snaps:
1. Copy the tarball files for `snap a` and `snap b` to the mm-extension branch([preinstalled-snap-e2e](https://github.com/V00D00-child/metamask-extension/tree/preinstalled-snap-e2e)) at the path `./deps`
2. Run `yarn install` to unpack the preinstalled snaps.
3. Run `yarn dist --build-type flask --apply-lavamoat false` to create a development build of MetaMask for Flask.
4. Follow these instructions to verify that your local build runs correctly:
   - [How to add custom build to Chrome](https://github.com/V00D00-child/metamask-extension/blob/main/docs/add-to-chrome.md)
   - [How to add custom build to Firefox](https://github.com/V00D00-child/metamask-extension/blob/main/docs/add-to-firefox.md)
5. Once the local build is runing in your browser, you can start interacting with the preinstalled snaps.

### Making permissions requests using preinstalled gator and kernel snap (web wallet repo)

1. Head back to the wallet repo:
  - Update the `package/site/.env.local` `KERNEL_SNAP_ORIGIN=npm:@metamask/permissions-kernel`
  - Run `yarn dev`
  - Navigate to `http://localhost:8000/`
2. Client connect button to connect dapp to kernel snap.
3. Make a permissions request.
4. Requests are sent to `kernel snap` -> `gator snap` preinstalls