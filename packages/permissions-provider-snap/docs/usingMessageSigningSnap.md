# Message signing Snap

For production the `@metamask/gator-permissions-snap` will use the [@metamask/message-signing-snap](https://github.com/MetaMask/message-signing-snap) (its preinstalled in mobile and extension) to authenticate with MetaMask Profile Sync to automatically store granted permissions.

## Local

The `@metamask/message-signing-snap` must be installed and the `@metamask/gator-permissions-snap` must have permission to communicate with the `@metamask/message-signing-snap`, or the request is rejected.

Since the `@metamask/message-signing-snap` is preinstalled in production, and has `initialConnections` configured to automatically connect to the `@metamask/gator-permissions-snap`(ie. [Pending the release in Flask to for @metamask/message-signing-snap endowment:rpc to allow requests from a Snap](https://github.com/MetaMask/metamask-extension/pull/32521)), this is not needed in production.

**onInstall()**

The `@metamask/gator-permissions-snap` will attempt to install a the `@metamask/message-signing-snap` at `local:http://localhost:8080` only when the `SNAP_ENV=local`

**Steps to install @metamask/message-signing-snap locally**

- https://github.com/MetaMask/message-signing-snap

```bash
# Clone the `@metamask/message-signing-snap`
git clone git@github.com:MetaMask/message-signing-snap.git

cd message-signing-snap

yarn install

yarn start
```
