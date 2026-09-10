# ERC-20 token swap permission

## Overview

`erc20-token-swap` is an ERC-7715 permission defined by its **outcome** rather than by the shape of the call it allows. The grantor lets a delegate call an allow-listed contract function that converts at most a stated amount of one ERC-20 token into at least a stated amount of another ERC-20 token, delivered to the grantor's own account.

The motivating use case is incident response: a user pre-signs a narrow permission, a watcher service redeems it when an exploit is detected on the protocol holding the position, and the proceeds land in the user's own account. The same shape covers scheduled or agent-driven swaps where the wallet should confirm what the user gets, not what calldata the site sends.

This builds on the direction sketched in the `feat/promised-outcomes` branch: the wallet interprets a promised outcome, turns it into enforcement caveats, shows the assured outcome to the user, and returns the caveats in the permission context.

## Request format

```jsonc
{
  "chainId": "0x1",
  "to": "0xDelegate",
  "permission": {
    "type": "erc20-token-swap",
    "isAdjustmentAllowed": true,
    "data": {
      "justification": "Exit your Pendle LP position to USDC if an exploit is detected.",
      "spend": { "tokenAddress": "0xPositionToken", "maxAmount": "0x…" },
      "receive": { "tokenAddress": "0xUSDC", "minAmount": "0x…" },
      "via": {
        "targets": ["0xRouter"],
        "selectors": [
          "removeLiquiditySingleToken(address,address,uint256,(address,uint256,address,address,(uint8,address,bytes,bool)),(address,bytes,bytes))",
        ],
      },
    },
  },
  "rules": [
    { "type": "expiry", "data": { "timestamp": 1790000000 } },
    { "type": "redeemer", "data": { "addresses": ["0xDelegate"] } },
  ],
}
```

| Field                                       | Meaning                                                                                                                                                                             |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `spend.tokenAddress`, `spend.maxAmount`     | The token that leaves the grantor's account, and the most of it that may leave per redemption.                                                                                      |
| `receive.tokenAddress`, `receive.minAmount` | The token that must arrive in the grantor's account, and the least of it that must arrive.                                                                                          |
| `via.targets`                               | The only contracts the delegate may call (1 to 5, unique).                                                                                                                          |
| `via.selectors`                             | The only functions the delegate may call on those contracts (1 to 8, unique). Each entry is a 4-byte hex selector or an ABI function signature such as `transfer(address,uint256)`. |
| `recipient` (optional)                      | Always the granting account. The wallet sets it from the account selected in the confirmation; if a dApp supplies it, it must match `from`.                                         |

Supported rules: `expiry`, `redeemer`. The `payee` rule is rejected because the recipient is always the grantor.

When `isAdjustmentAllowed` is true the user may edit `spend.maxAmount` and `receive.minAmount`. The allow-listed contracts and functions are never editable: they are part of the security guarantee. Expiry is always editable, as for the other permission types.

## Caveats

The permission composes existing Delegation Framework v1.3.0 enforcers; no new contracts are required.

| Enforcer                     | Terms                                                          | Purpose                                                                        |
| ---------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `AllowedTargetsEnforcer`     | `via.targets`                                                  | Bounds which contracts may be called.                                          |
| `AllowedMethodsEnforcer`     | `via.selectors`                                                | Bounds which functions may be called.                                          |
| `ValueLteEnforcer`           | `0`                                                            | No native token may be sent with the call.                                     |
| `ERC20BalanceChangeEnforcer` | increase, `receive.tokenAddress`, grantor, `receive.minAmount` | The grantor's balance of the received token must grow by at least `minAmount`. |
| `ERC20BalanceChangeEnforcer` | decrease, `spend.tokenAddress`, grantor, `spend.maxAmount`     | The grantor's balance of the spent token may shrink by at most `maxAmount`.    |
| `LimitedCallsEnforcer`       | `1`                                                            | The delegation may be redeemed once.                                           |

The grant pipeline appends the shared `TimestampEnforcer` (expiry rule), `RedeemerEnforcer` (redeemer rule) and `NonceEnforcer` caveats, as it does for every permission type.

The `ERC20BalanceChangeEnforcer` terms are 73 packed bytes (direction flag, token, recipient, amount), so a wallet can render "delivers at least 36,427.61 USDC to your own account" from the caveat bytes alone, with no protocol-specific decoding and no simulation.

## Why the allow-lists stay

The balance caveats alone reject a redirected payout, a payout in the wrong asset, and an under-delivering exit. They do not, however, bound _which_ asset is spent beyond the one named in `spend`: without `via`, a delegate could call any contract the grantor has approvals with and convert a different approved asset into the received token while satisfying both balance caveats. `via.targets` and `via.selectors` bound that blast radius, which is why they are required and never editable.

## Limitations

- **Single-call redemption.** `ERC20BalanceChangeEnforcer` only supports the default (single-call) execution mode. The exit must be one self-contained call, and any token approval the target needs must already exist.
- **Residual exposure.** Other assets already approved to `via.targets` remain reachable through the allowed selectors (for example a second position on the same router). Choose the narrowest target and selector set, and consider a follow-up that adds optional calldata pins.
- **Stale floor.** `receive.minAmount` is fixed when the user signs and goes stale as the market moves. It is a theft bound, not a slippage bound. A percentage-of-position or oracle-referenced enforcer would tighten it and would need new Solidity.
- **Distinct tokens.** The enforcer locks on `(caller, token, delegationHash)`, so `spend.tokenAddress` and `receive.tokenAddress` must differ. Validation rejects requests that use the same token for both.
- **ERC-20 only.** Native-token output is not supported yet; it would map to `NativeBalanceChangeEnforcer`.

## Companion changes required for signing

The MetaMask extension only signs a delegation for one of its own accounts when the request originates from ERC-7715 and the delegation's caveats decode into a known permission type. That decoding is done by `@metamask/gator-permissions-controller` using the decoder configs exported by `@metamask/7715-permission-types`. Until those packages know about `erc20-token-swap`, the extension rejects the signature with `External signature requests cannot sign delegations for internal accounts`.

To close the loop:

- `@metamask/7715-permission-types` (MetaMask/smart-accounts-kit): add the `Erc20TokenSwapPermission` type, `createErc20TokenSwapCaveats`, `makeErc20TokenSwapDecoderConfig` (required: allowed targets, allowed methods, value-lte, two balance-change caveats, limited calls, nonce; optional: timestamp, redeemer), a schema entry for the extension's permission views, and the `erc20BalanceChangeEnforcer`, `allowedMethodsEnforcer` and `limitedCallsEnforcer` entries in `EnforcerContractName`.
- `@metamask/gator-permissions-controller` (MetaMask/core): map `ERC20BalanceChangeEnforcer`, `AllowedMethodsEnforcer` and `LimitedCallsEnforcer` in `toEnforcerAddressesByName`.

Once the package ships its caveat constructor, the local `caveats.ts` in this snap can be replaced by an import, as was done for the other permission types.
