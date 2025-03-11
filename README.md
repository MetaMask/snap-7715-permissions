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
GATSBY_KERNEL_SNAP_ORIGIN=local:http://localhost:8080
GATSBY_GATOR_SNAP_ORIGIN=local:http://localhost:8081
```

### permissions-kernel-snap

- SNAP_ENV: The snap uses `SNAP_ENV` to dynamically map permission provider snapId to registered offers in the `PermissionOfferRegistry`. Please make use `SNAP_ENV=local` before building the snap.

### permissions-provider-snap

- SNAP_ENV: The snap uses `SNAP_ENV` to dynamically set the kernel snap snapId

## Getting Started

Clone the [snap-7715-permissions repository](https://github.com/MetaMask/snap-7715-permissions) and set up the development environment:

1. Set the .env `SNAP_ENV=local` in:
   - `./packages/permissions-kernel-snap/.env`
   - `./packages/permissions-provider-snap/.env`
2. Install and start up snaps with development site

```shell
yarn install && yarn start
```

The development site will start up on `http://localhost:8000/`

## Adding new permisssion types

Follow the following steps to add new permission types to the `permissions-provider-snap`:

1. Create new permission type definition with `permission.data` to `./packages/shared/src/types/7715-permissions-types.ts`
2. Add new permission type definition to the mapping(s) in `./packages/permissions-provider-snap/src/orchestrators/orchestrator/lookup-table.ts`
3. Run `yarn generate:orchestrator <nameOfYourOrchestrator>` script to create your orchestrator template.
4. Add your orchestrator to `orchestratorModules` and `zodObjectMapper` in `./packages/permissions-provider-snap/src/orchestrators/orchestrator/lookup-table.ts`

You are now all set to implement your orchestrators' interface.

## Contributing

### Testing

> **Note**: `@metamask/snaps-jest` assumes that the snap is built in the
> directory you're running Jest from. If you're using a different directory,
> you can specify the path to the snap using the [`root`](#options) option, or
> by running your own HTTP server.
>
> Right now it's not possible to use `@metamask/snaps-jest` with a snap that
> isn't built.

1. Set the .env `SNAP_ENV=local` in:
   - `./packages/permissions-kernel-snap/.env`
   - `./packages/permissions-provider-snap/.env`
2. Run `yarn build`
3. Run `yarn test` to run the tests once.

### Linting

Run `yarn lint` to run the linter, or run `yarn lint:fix` to run the linter and
fix any automatically fixable issues.

### Opening pull request

Both `@metamask/permissions-kernel` and `@metamask/7715-permissions-provider` require the environment variable `SNAP_ENV=production` to be set when creating the final commit for your PR. The `SNAP_ENV` value dynamically sets snapped values in the source code, so changing this value will update the `manifest.source.shasum`.

When CI runs, it will use the `SNAP_ENV=production` value. If this value is changed, the PRs `manifest.source.shasum` will not match the CI build shasum, which is required for CI to pass. Follow the steps below to produce a valid shasum. Please note that this is a manual process, and an alternative path toward automation should be investigated.

1. Set the .env `SNAP_ENV=production` in:
   - `./packages/permissions-kernel-snap/.env`
   - `./packages/permissions-provider-snap/.env`
2. Building the snaps with `yarn build` should update the shasum if applicable.
3. Push changes to your remote branch.

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

### Making permissions requests using preinstalled gator and kernel snap (snap repo)

1. Head back to the wallet repo:

- Update the `package/site/.env.development` `GATSBY_KERNEL_SNAP_ORIGIN=npm:@metamask/permissions-kernel`
- Run `yarn dev`
- Navigate to `http://localhost:8000/`

2. Client connect button to connect dapp to kernel snap.
3. Make a permissions request.
4. Requests are sent to `kernel snap` -> `gator snap` preinstalls
