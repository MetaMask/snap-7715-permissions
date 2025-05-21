# Snaps Preinstall e2e with MetaMask extension

> :warning: **Tarball file will need to be generate locally as it is not pushed to remote repos. Follow steps below to create a tarball.**

The tarball will allow us to test preinstall on the public [metamask-extension branch](https://github.com/V00D00-child/metamask-extension) without exposing the snaps codebase to the public.

1. Update the .env `SNAP_ENV=prod` in:
   - `./packages/permissions-kernel-snap/.env`
   - `./packages/gator-permissions-snap/.env`
2. Set `PRICE_API_BASE_URL=http://localhost:8003` in `./packages/gator-permissions-snap/.env` to fetch spot prices from mock price API running locally.
3. From root of repo run the following:

```bash
mkdir deps
yarn build:pack
```

## Add preinstalls to mm-extension local build (mm-extension repo)

Follow these steps to build a local version of MetaMask with packed preinstalled snaps:

1. Copy the tarball files for `snap a` and `snap b` to the mm-extension branch([preinstalled-snap-e2e](https://github.com/V00D00-child/metamask-extension/tree/preinstalled-snap-e2e)) at the path `./deps`
2. Run `yarn install` to unpack the preinstalled snaps.
3. Run `yarn dist --build-type flask --apply-lavamoat false` to create a development build of MetaMask for Flask.
4. Follow these instructions to verify that your local build runs correctly:
   - [How to add custom build to Chrome](https://github.com/V00D00-child/metamask-extension/blob/main/docs/add-to-chrome.md)
   - [How to add custom build to Firefox](https://github.com/V00D00-child/metamask-extension/blob/main/docs/add-to-firefox.md)
5. Once the local build is runing in your browser, you can start interacting with the preinstalled snaps.

## Making permissions requests using preinstalled gator and kernel snap (snap repo)

1. Head back to the wallet repo:

- Update the `package/site/.env.development` `GATSBY_KERNEL_SNAP_ORIGIN=npm:@metamask/permissions-kernel-snap`
- Run `yarn dev`
- Navigate to `http://localhost:8000/`

2. Client connect button to connect dapp to kernel snap.
3. Make a permissions request.
4. Requests are sent to `kernel snap` -> `gator snap` preinstalls