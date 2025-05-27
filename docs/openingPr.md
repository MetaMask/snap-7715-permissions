# Opening pull request

Both `@metamask/permissions-kernel-snap` and `@metamask/gator-permissions-snap` require the environment variable `SNAP_ENV=production` to be set when creating the final commit for your PR. The `SNAP_ENV` value dynamically sets snapped values in the source code, so changing this value will update the `manifest.source.shasum`.

When CI runs, it will use the `SNAP_ENV=production` value. If this value is changed, the PRs `manifest.source.shasum` will not match the CI build shasum, which is required for CI to pass. Follow the steps below to produce a valid shasum. Please note that this is a manual process, and an alternative path toward automation should be investigated.

1. Set the .env to production values for `@metamask/permissions-kernel-snap` and `@metamask/gator-permissions-snap`:
2. `./packages/permissions-kernel-snap/.env`
   - Production values can be found in [.env.example](/packages/permissions-kernel-snap/..env.example)
3. `./packages/gator-permissions-snap/.env`
   - Production values can be found in [.env.example](/packages/gator-permissions-snap/..env.example)
4. Building the snaps with `yarn build` should update the shasum if applicable.
5. Push changes to your remote branch.