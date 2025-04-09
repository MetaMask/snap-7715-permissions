# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.0.1]

### Uncategorized

- add changelog scripts ([#55](https://github.com/MetaMask/snap-7715-permissions/pull/55))
- ensure create-release-branch cli tool passes ([#54](https://github.com/MetaMask/snap-7715-permissions/pull/54))
- feat: add release gh actions ([#51](https://github.com/MetaMask/snap-7715-permissions/pull/51))
- feat: register event handlers to handle permission confirmation dialog events ([#48](https://github.com/MetaMask/snap-7715-permissions/pull/48))
- feat: render permission specific rules ([#45](https://github.com/MetaMask/snap-7715-permissions/pull/45))
- feat: Add stream amount component ([#43](https://github.com/MetaMask/snap-7715-permissions/pull/43))
- feat: update `AccountDetails` component to match designs, use `price api` for spot price and fetch user locale preferences ([#41](https://github.com/MetaMask/snap-7715-permissions/pull/41))
- Update delegator-core-viem, remove patch, show error when user declines / rpc request fails.
- Merge branch 'main' into feat/viem_experimental
- add correct header text for native token stream ([#40](https://github.com/MetaMask/snap-7715-permissions/pull/40))
- Revery yarn.lock and rebuild
- Fix call to grantPermissions
- Deduplicate @metamask-private/delegator-core-viem and viem
- Implement redeeming granted permission - work around in place for RPC failures when the wallet SCA is deployed.
- Make permission singular
- Enable linting of tsx in site package. Ensure locally installed version of eslint is used. Disable no-restricted-globals, because we love restricted-global in the site package.
- Merge branch 'main' into feat/viem_experimental
- update request details to match designs and add svg images ([#38](https://github.com/MetaMask/snap-7715-permissions/pull/38))
- Introduce delegator-core-viem@0.7.0 dependency and use experimental grantPermissions function. Patch delegator-core-viem with bugfix for missing justification.
- Move resolveInterface into render handler
- Close confirmation dialog within renderhandler
- Update manifest
- Fix linting
- Feedback from review
- Fix linting issues
- Simplify responsibilities of components: - PermissionConfirmationRenderHandler is responsible for triggering the dialog and resolving confirmationResult - Specific Permission OrchestrateArgs is responsible for resolving the attenuated state and attenuated expiry (deferred for now) - orchestrate() function is responsible for coordinating the relationship between other components
- Make linting run individual module lint commands instead of global linting. Resolve inconsistency with lint execution. Resolve linting errors in .tsx files (previously skipped).
- Merge branch 'main' into feat/decouple-user-events
- Fix linting errors, and improve userEventDispatcher tests
- feat: Add PermissionsContextBuilder and build caveats for native token stream ([#35](https://github.com/MetaMask/snap-7715-permissions/pull/35))
- Implement UserEventDispatcher and tests. Integrate into orchestrator flow.
- feat: Add validate logic for native token stream permission data ([#33](https://github.com/MetaMask/snap-7715-permissions/pull/33))
- chore: drop mock account controller and mock delegation manager address ([#34](https://github.com/MetaMask/snap-7715-permissions/pull/34))
- chore: small refactor to use multiple permission orchestrators ([#31](https://github.com/MetaMask/snap-7715-permissions/pull/31))
- update 7715 types to match mm proposed types ([#30](https://github.com/MetaMask/snap-7715-permissions/pull/30))
- fix merge conflicts
- fix merge conflict
- do not pass delegation through UI
- fix merge conflict
- Feat/native token stream permission validator ([#27](https://github.com/MetaMask/snap-7715-permissions/pull/27))
- fix merge conflict
- fix spelling mistake
- Add getDelegationManager() function to MockAccountController
- Merge branch 'main' into feat/provider-core
- remove handlePermissionCase and maintain the 7715 terminology
- fix merge conflicts
- Remove explicit references to future orchestrator factory
- addess PR comments and drop ui factory
- update parseAndValidate to use basePermission instead of basePermissionRequest
- rebase to bring in orchestrator interface updates
- update interface
- update orchestrator interface
- Only import Address as type
- Add delegation manager to account controller
- Update snap checksum
- Generic dispatcher for permission cases based on the permission type and testing
- Update manifest checksum
- Changes per review: - change rpchandler from class to pojo - rename entrypoint.ts to index.ts
- add test cases
- rename test file and update changelog
- fix merge conflicts
- add pr comments
- add permission validation
- add test coverage
- simplify orchestrator
- Fix invalid assertion, change coverage provider to v8 to fix failing test coverage
- Fix linting errors and invalid test assertion
- Show chainId and address in placeholder confirmation. Make requests for sepolia (because mainnet is not supported).
- happy path working e2e with mock account controller
- Update manifest checksum :/
- fix merge conflicts
- Introduce entrypoint, RpcHandler, simplify placeholder confirmation. Simplify MockSnapProvider.
- fix merge conflict
- wire up native token stream orchestrate e2e with mock results
- sync with parent branch
- drop native token transfer orchestrator
- orchestrate happy path
- Update manifests
- Merge branch 'main' into feat/account-controller
- Update manifest
- Add validation to supported chains and corresponding tests
- Do not inject logger into AccountController. Allow caller to not supply chains parameter (defaults to all chains), require chains parameter to only include supported chains.
- Fix linting errs
- move orchestrator types out of shared, decreased the number of type definitions, renaming and add native token stream permission
- Merge branch 'chore/cleanup-permission-provider-snap' of github.com:MetaMask/snap-7715-permissions into create-specific-permission-orchestrators-interface
- address pr comments
- Apply suggestions from code review
- Simplify implementation: - why use @metamask keyrings? - if the Signer isn't acting as an adapter, why have it at all
- Add some comments and stuff
- Put back in changes to kernel. Add comment. Remove testing code.
- Fix tests
- Upgrade delegator sdk. Add SignTypedDataAdapter. ExperimentalProviderRequest now works.
- simplify the factory logic to use record
- orchestrate needs the entire permission request with type asserted permission.data to build final res. Final res=originalRequestWithAttenuations+signedPermission
- remove snap global from test since we dependency inject the SnapsProvider
- make validate interface async
- use correct pr number in changelog
- create permission orchestrator interface with generic factory
- Tidy up account controller and signer. Mostly working, just needs polish, better tests, and the experimental API to work. Maybe some more functionality.
- Working towards testing the account controller in the extension
- Add simple tests for signer
- Derive mnemonic from entropy. Map snap_experimentalProviderRequest to provider.
- Initial commit noodling with account controller
- drop logger file from permission provider
- remove ts paths and use yarn workspaces
- add test case for permission provider snap
- allow test in shared
- fix merge conflicts
- clean up permission provider package
- tell Jest how to resolve mm shard package paths
- address more pr comments
- address pr comments
- fix lint errors
- more test coverage for kernel
- fix 7715 permissions types
- update mainifest file shasum to build with production env values
- hardcode SNAP_ENV in build workflow
- update workflow to handle 2 snaps
- update readme
- fix e2e permissions request, fix failing lint and test
- bring in kernel and gator snap

### Added

- Add specific permission orchestrators interface ([#24](https://github.com/MetaMask/snap-7715-permissions/pull/24))
- Implement native-token-stream orchestrate happy path ([#25](https://github.com/MetaMask/snap-7715-permissions/pull/25))

### Changed

- Remove unnecessary code within the permission provider and add placeholder confirmation with simple "Confirm" "Reject" options. ([#21](https://github.com/MetaMask/snap-7715-permissions/pull/21))

[Unreleased]: git+https://github.com/MetaMask/snap-7715-permissions/compare/@metamask/gator-permissions@0.0.1...HEAD
[0.0.1]: git+https://github.com/MetaMask/snap-7715-permissions/releases/tag/@metamask/gator-permissions@0.0.1
