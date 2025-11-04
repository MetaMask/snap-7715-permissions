# Persisting Granted Permissions Architecture

## Overview

This document will provide an overview of the `@metamask/gator-permissions-snap` internal process for storing and retrieving a user's permissions.

The `@metamask/gator-permissions-snap` will automatically store granted permissions using MetaMask Profile Sync.

Pending `@metamask/gator-permissions-snap` reaching preinstall status, we will provide the user with the option to view the persisted permissions in the MetaMask extension to revoke them in the future via interaction with MetaMask Profile Sync in the extension codebase.

In the meantime(i.e., while `@metamask/gator-permissions-snap` is still a manual install), the `@metamask/gator-permissions-snap` will serve as the location where the user can view persisted permissions and initiate the revocation process.

**Useful links:**

- [@metamask/message-signing-snap](https://github.com/MetaMask/message-signing-snap) (preinstalled in mobile and extension)
- [Profile sync SDK(i.e ProfileSyncController)](https://www.npmjs.com/package/@metamask/profile-sync-controller)

## Profile Sync SDK: OAuth 2.0 Authentication flow

- **IdentifierID**: We will use the `SRP` identifier that uses the message signing snap to derive a public key.
- **Identifier Secret**: We will derive the private key from the automatic message signing snap using SRP as the identifier. The private key is used to sign an authentication message to allow the user to prove ownership of the `SRP` identifier

```mermaid
sequenceDiagram
 autonumber
 participant @metamask/gator-permissions-snap
 participant @metamask/message-signing-snap
 participant profileSyncService

 @metamask/gator-permissions-snap->>@metamask/message-signing-snap: Call the messaging system to retrieve the identifier id
 @metamask/gator-permissions-snap->>@metamask/message-signing-snap: Call the messaging system to sign the profile sync authentication message
 @metamask/gator-permissions-snap->>profileSyncService: Verifies that the user owns the provided SRP by verifying the authentication message
 profileSyncService->>@metamask/gator-permissions-snap: Sends back a JWT identity token
 @metamask/gator-permissions-snap->>profileSyncService: Request and exchange of JWT identity token for a JWT access token
 profileSyncService->>@metamask/gator-permissions-snap: Sends a valid JWT access token
 @metamask/gator-permissions-snap->>profileSyncService: Uses the JWT access token to access protected resources(i.e granted permissions)
```

## Granted permissions store flow

- **feature**: Is the namespace for grouping related object keys. We will reserve a namespace of `gator_7715_permissions` as the feature name to store all of the user's granted permissions.
- **object key**: This serves as a distinctive identifier for accessing or modifying the granted permission value. We will use the `permissionContext` (i.e., the encoded signed delegation) as the unique identifier for each item stored under the `gator_7715_permissions` feature name.
- **object value**: The actual granted permission data stored as a serialized JSON string that **should not exceed 400KB**.

The Granted permissions storage flow diagram shows the path an granted permission takes to during the permission request fulfill process to automatically storage permission encrypted by the user SRP.

```mermaid
sequenceDiagram
 autonumber
 participant onRpcRequest
 participant rpcHandler
 participant profileSyncModule

Note over onRpcRequest: RPC entrypoint(incoming RPC permission request)
Note over onRpcRequest: RPC entrypoint(post fulfillment of a granted permission)

onRpcRequest->>rpcHandler: Receives a permission request
rpcHandler->>profileSyncModule: Kicks of auth ceremony by calling getAccessToken()
rpcHandler->>profileSyncModule: Calls storeGrantedPermission the store the granted permission in profile sync
rpcHandler->>onRpcRequest: Return granted permission result back to dApp
```

## Granted permissions retrieval flow(view)

The user can view the granted permission fetched from profile sync on the `@metamask/gator-permissions-snap` homepage.

```mermaid
sequenceDiagram
 autonumber
 participant onHomePage
 participant profileSyncModule

Note over onHomePage: Custom JSX component that gives the user the ability to view granted permissions
onHomePage->>profileSyncModule: Fetch all permission for SRP profile stored under the `gator_7715_permissions` feature namespace
onHomePage->>onHomePage: Render UI to show granted permission details
```

## Granted permissions revocation flow

TBD

```mermaid
sequenceDiagram
 autonumber
 participant onHomePage
 participant onRpcRequest
 participant rpcHandler
 participant profileSyncModule

Note over onHomePage: Custom JSX component that with CTA to revoke that initiates a internal call to `wallet_revokePermissions`
Note over onRpcRequest: RPC entrypoint(internal RPC permission request for `wallet_revokePermissions`)
```
