# Opening pull request

Both `@metamask/permissions-kernel-snap` and `@metamask/gator-permissions-snap` require the environment variable `SNAP_ENV=production` to be set when creating the final commit for your PR. The `SNAP_ENV` value dynamically sets snapped values in the source code, so changing this value will update the `manifest.source.shasum`.

When CI runs, it will use the `SNAP_ENV=production` value. If this value is changed, the PRs `manifest.source.shasum` will not match the CI build shasum, which is required for CI to pass. Follow the steps below to produce a valid shasum. Please note that this is a manual process, and an alternative path toward automation should be investigated.

1. Set the .env `SNAP_ENV=production` in:
   - `./packages/permissions-kernel-snap/.env`
   - `./packages/permissions-provider-snap/.env`
2. Set `PRICE_API_BASE_URL=<prod_base_url>` in `./packages/permissions-provider-snap/.env` to
3. Building the snaps with `yarn build` should update the shasum if applicable.
4. Push changes to your remote branch.