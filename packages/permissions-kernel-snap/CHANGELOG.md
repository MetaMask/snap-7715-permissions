# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.0]

### Changed

- Expiry is now optional ([#240](https://github.com/MetaMask/snap-7715-permissions/pull/240))

## [0.5.0]

### Fixed

- Throw appropriate `SnapError` when an error is thrown by the target of an RPC ([#211](https://github.com/MetaMask/snap-7715-permissions/pull/211))

## [0.4.0]

### Changed

- `snap.manifest.ts` version bumped to 3.0.0

## [0.3.0]

### Added

- Add hideSnapBranding flag to preinstalled snap manifest
- feat(manifest): add environment-based manifest management ([#153](https://github.com/MetaMask/snap-7715-permissions/pull/153))
- Validate kernel rpc request ([#160](https://github.com/MetaMask/snap-7715-permissions/pull/160))
- Feat/ephemeral permission offer registry ([#101](https://github.com/MetaMask/snap-7715-permissions/pull/101))
- Add `erc20-token-stream` permission ([#100](https://github.com/MetaMask/snap-7715-permissions/pull/100))
- Add `native-token-periodic` permission ([#89](https://github.com/MetaMask/snap-7715-permissions/pull/89))
- Add native token periodic transfer to expected default permissions
- feat: add native token periodic permission type and handler
- Persisting Granted Permissions with MM Profile Sync ([#84](https://github.com/MetaMask/snap-7715-permissions/pull/84))

### Changed

- Rename RPC Urls to have consistent prefixes ([#168](https://github.com/MetaMask/snap-7715-permissions/pull/168))
- Remove unused GATOR_PERMISSIONS_PROVIDER_SNAP_ID and update initialPermissions to disable snaps
- Disable logging in production ([#161](https://github.com/MetaMask/snap-7715-permissions/pull/161))
- getRegisteredPermissionOffers array optimization ([#159](https://github.com/MetaMask/snap-7715-permissions/pull/159))
- Process permission requests sequentially ([#150](https://github.com/MetaMask/snap-7715-permissions/pull/150))
- Use null where appropriate ([#143](https://github.com/MetaMask/snap-7715-permissions/pull/143))
- refactor(core): validate chain support early in permission request ([#145](https://github.com/MetaMask/snap-7715-permissions/pull/145))
- Change generic errors with snap errors ([#135](https://github.com/MetaMask/snap-7715-permissions/pull/135))
- Update shasum, in preparation for merge to main ([#137](https://github.com/MetaMask/snap-7715-permissions/pull/137))
- Chore/integrate new permission types ([#134](https://github.com/MetaMask/snap-7715-permissions/pull/134))
- Update input validation ([#110](https://github.com/MetaMask/snap-7715-permissions/pull/110))
- Downgrade @types/react from 18.3.23 to 18.2.4
- Reduce usage of @metamask/delegation-toolkit and viem ([#107](https://github.com/MetaMask/snap-7715-permissions/pull/107))
- Bump the npm_and_yarn group across 1 directory with 3 updates ([#78](https://github.com/MetaMask/snap-7715-permissions/pull/78))
- Improve profile sync dev experience ([#86](https://github.com/MetaMask/snap-7715-permissions/pull/86))
- Update ARCHITECTURE.md to reflect current state. Update manifest files.

### Removed

- Remove development constants from production artifacts ([#148](https://github.com/MetaMask/snap-7715-permissions/pull/148))
- Remove unused code and images ([#111](https://github.com/MetaMask/snap-7715-permissions/pull/111))
- Remove 'viem' dependency from package.json and related files ([#154](https://github.com/MetaMask/snap-7715-permissions/pull/154))

### Fixed

- fix: TokenIcon runtime type enforcement ([#155](https://github.com/MetaMask/snap-7715-permissions/pull/155))
- feat: Incorrect token currency shown ([#152](https://github.com/MetaMask/snap-7715-permissions/pull/152))
- Prevent prototype pollution ([#147](https://github.com/MetaMask/snap-7715-permissions/pull/147))
- fix(gator-permissions-snap): fix return type for account addresses ([#141](https://github.com/MetaMask/snap-7715-permissions/pull/141))
- Fix typos ([#98](https://github.com/MetaMask/snap-7715-permissions/pull/98))
- Fix linting: - add eslint packages to packages - fix linting errors in gator permissions snap
- Fix issue where accountMeta was not being included on the response object correctly. ([#95](https://github.com/MetaMask/snap-7715-permissions/pull/95))

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

[Unreleased]: https://github.com/MetaMask/snap-7715-permissions/compare/@metamask/permissions-kernel-snap@0.6.0...HEAD
[0.6.0]: https://github.com/MetaMask/snap-7715-permissions/compare/@metamask/permissions-kernel-snap@0.5.0...@metamask/permissions-kernel-snap@0.6.0
[0.5.0]: https://github.com/MetaMask/snap-7715-permissions/compare/@metamask/permissions-kernel-snap@0.4.0...@metamask/permissions-kernel-snap@0.5.0
[0.4.0]: https://github.com/MetaMask/snap-7715-permissions/compare/@metamask/permissions-kernel-snap@0.3.0...@metamask/permissions-kernel-snap@0.4.0
[0.3.0]: https://github.com/MetaMask/snap-7715-permissions/compare/@metamask/permissions-kernel-snap@0.2.0...@metamask/permissions-kernel-snap@0.3.0
[0.2.0]: https://github.com/MetaMask/snap-7715-permissions/compare/@metamask/permissions-kernel-snap@0.1.0...@metamask/permissions-kernel-snap@0.2.0
[0.1.0]: https://github.com/MetaMask/snap-7715-permissions/compare/@metamask/permissions-kernel-snap@0.0.1...@metamask/permissions-kernel-snap@0.1.0
[0.0.1]: https://github.com/MetaMask/snap-7715-permissions/releases/tag/@metamask/permissions-kernel-snap@0.0.1
