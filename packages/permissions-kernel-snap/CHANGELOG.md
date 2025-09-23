# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0]

### Uncategorized

- Add hideSnapBranding flag to preinstalled snap manifest
- Rename RCP Urls To Be Consistent ([#168](https://github.com/MetaMask/snap-7715-permissions/pull/168))
- chore: changed to plural refereces of permissionProvider
- chore: rename rpc urls to be consistent
- Remove unused GATOR_PERMISSIONS_PROVIDER_SNAP_ID and update initialPermissions to disable snaps
- Disable logging in production ([#161](https://github.com/MetaMask/snap-7715-permissions/pull/161))
- feat(manifest): add environment-based manifest management ([#153](https://github.com/MetaMask/snap-7715-permissions/pull/153))
- Validate kernel rpc request ([#160](https://github.com/MetaMask/snap-7715-permissions/pull/160))
- fix: TokenIcon runtime type enforcement ([#155](https://github.com/MetaMask/snap-7715-permissions/pull/155))
- getRegisteredPermissionOffers array optimization ([#159](https://github.com/MetaMask/snap-7715-permissions/pull/159))
- Process permission requests sequentially ([#150](https://github.com/MetaMask/snap-7715-permissions/pull/150))
- chore: remove 'viem' dependency from package.json and related files ([#154](https://github.com/MetaMask/snap-7715-permissions/pull/154))
- feat: Incorrect token currency shown ([#152](https://github.com/MetaMask/snap-7715-permissions/pull/152))
- Remove development constants from production artifacts ([#148](https://github.com/MetaMask/snap-7715-permissions/pull/148))
- Use null where appropriate ([#143](https://github.com/MetaMask/snap-7715-permissions/pull/143))
- refactor(core): validate chain support early in permission request ([#145](https://github.com/MetaMask/snap-7715-permissions/pull/145))
- Prevent prototype pollution ([#147](https://github.com/MetaMask/snap-7715-permissions/pull/147))
- Change generic errors with snap errors ([#135](https://github.com/MetaMask/snap-7715-permissions/pull/135))
- fix(gator-permissions-snap): fix return type for account addresses ([#141](https://github.com/MetaMask/snap-7715-permissions/pull/141))
- Update shasum, in preparation for merge to main ([#137](https://github.com/MetaMask/snap-7715-permissions/pull/137))
- Chore/integrate new permission types ([#134](https://github.com/MetaMask/snap-7715-permissions/pull/134))
- feat(ui): add TokenField component for displaying token info ([#136](https://github.com/MetaMask/snap-7715-permissions/pull/136))
- Allow user to select EOA from which to grant the permission ([#125](https://github.com/MetaMask/snap-7715-permissions/pull/125))
- Update input validation ([#110](https://github.com/MetaMask/snap-7715-permissions/pull/110))
- Refactor: extract common field components into reusable Field component ([#122](https://github.com/MetaMask/snap-7715-permissions/pull/122))
- style: fix indentation in package.json files and docs
- build: downgrade @types/react from 18.3.23 to 18.2.4
- update error message
- update manifest
- Update linter rule for empty line is js docs and update comments to have an empty line
- linter fixes
- Update snap manifest
- Merge branch 'main' of https://github.com/MetaMask/snap-7715-permissions into chore/dependency-updates
- Remove unused code and images ([#111](https://github.com/MetaMask/snap-7715-permissions/pull/111))
- bump major version on dependencies
- update node version, bump dependencies
- Reduce usage of @metamask/delegation-toolkit and viem ([#107](https://github.com/MetaMask/snap-7715-permissions/pull/107))
- Feat/ephemeral permission offer registry ([#101](https://github.com/MetaMask/snap-7715-permissions/pull/101))
- Add `erc20-token-stream` permission ([#100](https://github.com/MetaMask/snap-7715-permissions/pull/100))
- Fix issue where accountMeta was not being included on the response object correctly. ([#95](https://github.com/MetaMask/snap-7715-permissions/pull/95))
- Add `native-token-periodic` permission ([#89](https://github.com/MetaMask/snap-7715-permissions/pull/89))
- Fix typos ([#98](https://github.com/MetaMask/snap-7715-permissions/pull/98))
- Merge branch 'main' into feat/native-token-periodic
- Bump the npm_and_yarn group across 1 directory with 3 updates ([#78](https://github.com/MetaMask/snap-7715-permissions/pull/78))
- Add native token periodic transfer to expected default permissions
- refactor: reduce boilerplate in permission definitions
- Remove errant console.log
- feat: add native token periodic permission type and handler
- Fix linting: - add eslint packages to packages - fix linting errors in gator permissions snap
- Improve profile sync dev experience ([#86](https://github.com/MetaMask/snap-7715-permissions/pull/86))
- Persisting Granted Permissions with MM Profile Sync ([#84](https://github.com/MetaMask/snap-7715-permissions/pull/84))
- Update ARCHITECTURE.md to reflect current state. Update manifest files."
- Can now remove optional permission properties
- Merge branch 'main' into docs/provider-architecture
- Simplify confirmation dialog structure
- upgrade delegation-toolkit and improve UI components
- improve permission request orchestration and code quality
- Split permission request validation and hydration
- Iterate on nativetokenstream confirmation to be closer to design requirements. Add origin, network, token to confirmation.
- Add context metadata to hold ephemeral and derived data in the context. Add basic validation messages for native token stream.
- Remove deprecated code
- Implement proposed architecture end to end, including NativeTokenStream basic functionality, but no special handling of optional rules etc.
- Release/4.0.0 ([#81](https://github.com/MetaMask/snap-7715-permissions/pull/81))

## [0.2.0]

### Fixed

- Allow initialAmount and maxAllowance to be unspecified ([#75](https://github.com/MetaMask/snap-7715-permissions/pull/75))

## [0.1.0]

### Added

- Support the option for the user to adjust permissions requested by the DApp ([#52](https://github.com/MetaMask/snap-7715-permissions/pull/52))

## [0.0.1]

### Added

- Add kernel and gator snap ([#13](https://github.com/MetaMask/snap-7715-permissions/pull/13))

### Changed

- Improve test coverage for kernel snap ([#18](https://github.com/MetaMask/snap-7715-permissions/pull/18))
- Add changelog scripts ([#55](https://github.com/MetaMask/snap-7715-permissions/pull/55))
- ensure create-release-branch cli tool passes ([#54](https://github.com/MetaMask/snap-7715-permissions/pull/54))
- Add release gh actions ([#51](https://github.com/MetaMask/snap-7715-permissions/pull/51))
- Update `AccountDetails` component to match designs, use `price api` for spot price and fetch user locale preferences ([#41](https://github.com/MetaMask/snap-7715-permissions/pull/41))
- Add validate logic for native token stream permission data ([#33](https://github.com/MetaMask/snap-7715-permissions/pull/33))
- Update 7715 types to match mm proposed types ([#30](https://github.com/MetaMask/snap-7715-permissions/pull/30))

[Unreleased]: https://github.com/MetaMask/snap-7715-permissions/compare/@metamask/permissions-kernel-snap@0.3.0...HEAD
[0.3.0]: https://github.com/MetaMask/snap-7715-permissions/compare/@metamask/permissions-kernel-snap@0.2.0...@metamask/permissions-kernel-snap@0.3.0
[0.2.0]: https://github.com/MetaMask/snap-7715-permissions/compare/@metamask/permissions-kernel-snap@0.1.0...@metamask/permissions-kernel-snap@0.2.0
[0.1.0]: https://github.com/MetaMask/snap-7715-permissions/compare/@metamask/permissions-kernel-snap@0.0.1...@metamask/permissions-kernel-snap@0.1.0
[0.0.1]: https://github.com/MetaMask/snap-7715-permissions/releases/tag/@metamask/permissions-kernel-snap@0.0.1
