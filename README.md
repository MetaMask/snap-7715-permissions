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
- PRICE_API_BASE_URL: The base URL for the price API used to fetch realtime token spot prices.

## Getting Started

Clone the [snap-7715-permissions repository](https://github.com/MetaMask/snap-7715-permissions) and set up the development environment:

1. Set the .env `SNAP_ENV=local` in:
   - `./packages/permissions-kernel-snap/.env`
   - `./packages/permissions-provider-snap/.env`
2. Set `PRICE_API_BASE_URL=http://localhost:8003` in `./packages/permissions-provider-snap/.env` to fetch spot prices from mock price API running locally.
3. Install and start up snaps with development site

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

1. Set the .env `SNAP_ENV=local` in:
   - `./packages/permissions-kernel-snap/.env`
   - `./packages/permissions-provider-snap/.env`
2. Set `PRICE_API_BASE_URL=http://localhost:8003` in `./packages/permissions-provider-snap/.env` to fetch spot prices from mock price API running locally.
3. Run `yarn build`
4. Run `yarn test` to run the tests once.

### Linting

Run `yarn lint` to run the linter, or run `yarn lint:fix` to run the linter and
fix any automatically fixable issues.

### Using NPM packages with scripts

Scripts are disabled by default for security reasons. If you need to use NPM
packages with scripts, you can run `yarn allow-scripts auto`, and enable the
script in the `lavamoat.allowScripts` section of `package.json`.

See the documentation for [@lavamoat/allow-scripts](https://github.com/LavaMoat/LavaMoat/tree/main/packages/allow-scripts)
for more information.

