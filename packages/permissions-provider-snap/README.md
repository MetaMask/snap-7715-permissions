# @metamask/7715-permissions-provider

This snap creates Hybrid DeleGator account and allow site to request 7715 permissions from those accounts. User have the option to grant the permission from a confimation dialog render by the snap or from a confirmation screen render on the web wallet site.

## Development

1. install dependencies
```bash
yarn
```
2. start the dev server
```bash
yarn dev
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

1. `cd packages/permissions-provider-snap`
2. `SNAP_ENV=dev` in `packages/permissions-provider-snap/.env`
3. `yarn build`
4. `yarn test`
