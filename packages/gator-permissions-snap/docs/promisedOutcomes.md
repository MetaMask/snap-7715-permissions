# Promised Outcomes

## Overview

This document will provide an overview of the `MetaMask Promised Outcomes` feature. We can extend an ERC-7715 permission response to enforce promises made by the dapp regarding the outcomes of the granted permissions without relying solely on the dapp's honesty.

## Providing Promised outcomes

When constructing a permission request for the wallet, the dApp can attach `promisedOutcomes`. The `promisedOutcomes` field is an array of objects, each representing a promised outcome. The type field specifies the kind of outcome being promised, and the data field contains type-specific details.

Some potential types of promised outcomes:

- `exact-transfer`: Promises an exact transfer of a specific asset amount to a recipient.
- `event-emission`: Promises that a specific event will be emitted with certain parameters.
- `custom`: Allows for open-ended custom promises with wallet-interpreted logic.

## Wallet Responsibilities

Upon receiving a `PermissionsRequest` with `promisedOutcomes`, the wallet should:

1. Interpret the `promisedOutcomes` and generate corresponding enforcement caveats.
2. Present the assured outcomes to the user for approval and the requested permissions.
3. If approved, include the enforcement caveats in the `PermissionsContext` returned to the dapp.

The wallet should strive to enforce the promised outcomes as closely as possible, with a caveat enforcer with an `afterHook`. Additionally, that wallet may run a runtime simulation to guarantee the promised outcomes further.
