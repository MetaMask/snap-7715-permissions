# @metamask/permissions-kernel

This snap manages a `permissions offer registry` of all the permissions a user is willing to grant via a 7715 permissions request. A dApp will make a 7715 permissions request to the kernel, which will forward the request to a permissions provider snap for user attenuation. The kernel rejects the request if the dApp asks for permission that is not in the registry.

The permissions offer registry comes with a default set of 7715 permission types(e.g., native-transfer, erc20-token-transfer), and it will grow as MetaMask supports new permission types. Initially, MetaMask will own the process of onboarding new permission types, but that process could also expand to allow any dApp proposal for new permission types to the kernel(with user consent). This end state creates a custom permissionless permission offer registry tailored to each user's installation of MetaMask as they interact with dApps.

## Development

1. install dependencies

```bash
yarn
```

2. start the dev server

```bash
yarn start
```

## Build

```bash
yarn build
```

## Test

> **Note**: `@metamask/snaps-jest` assumes that the snap is built in the
> directory you're running Jest from. If you're using a different directory,
> you can specify the path to the snap using the [`root`](#options) option, or
> by running your own HTTP server.
>
> Right now it's not possible to use `@metamask/snaps-jest` with a snap that
> isn't built.

1. `SNAP_ENV=dev` in `packages/permissions-kernel-snap/.env`
2. `yarn build`
3. `yarn test`
