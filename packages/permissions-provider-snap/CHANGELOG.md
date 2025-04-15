# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0]

### Uncategorized

- Allow intitialAmount and maxAllowance to be unspecified ([#75](https://github.com/MetaMask/snap-7715-permissions/pull/75))
- Fix number formatting for rules to not truncate decimal places

## [0.1.0]

### Added

- Support the option for the user to adjust permissions requested by the DApp ([#52](https://github.com/MetaMask/snap-7715-permissions/pull/52))
  - Build `@metamask/gator-permissions-snap` with the appropriate `PRICE_API_BASE_URL` environment variable configured.
- Add Snap homepage context. This will show in a dialog when first installing the snap and in the snap homepage ([#63](https://github.com/MetaMask/snap-7715-permissions/pull/63))
- Add Snaps `endowment:page-home` permission to enable a Snaps home page for `@metamask/gator-permissions-snap` ([#72](https://github.com/MetaMask/snap-7715-permissions/pull/72))

### Fixed

- Update bugs url in package.json files to point to correct repository ([#70](https://github.com/MetaMask/snap-7715-permissions/pull/70))
- Fixed various issues with permission data binding and resolving user input data ([#71](https://github.com/MetaMask/snap-7715-permissions/pull/71))

## [0.0.1]

### Changed

- Remove unnecessary code within the permission provider and add placeholder confirmation with simple "Confirm" "Reject" options. ([#21](https://github.com/MetaMask/snap-7715-permissions/pull/21))
- Native token stream permission validator ([#27](https://github.com/MetaMask/snap-7715-permissions/pull/27))
- Updated 7715 types to match mm proposed types ([#30](https://github.com/MetaMask/snap-7715-permissions/pull/30))
- Add specific permission orchestrators interface ([#24](https://github.com/MetaMask/snap-7715-permissions/pull/24))
- Implement native-token-stream orchestrate happy path ([#25](https://github.com/MetaMask/snap-7715-permissions/pull/25))
- Small refactor to use multiple permission orchestrators ([#31](https://github.com/MetaMask/snap-7715-permissions/pull/31))
- Add validate logic for native token stream permission data ([#33](https://github.com/MetaMask/snap-7715-permissions/pull/33))
- Drop mock account controller and mock delegation manager address ([#34](https://github.com/MetaMask/snap-7715-permissions/pull/34))
- Add PermissionsContextBuilder and build caveats for native token stream ([#35](https://github.com/MetaMask/snap-7715-permissions/pull/35))
- Update request details to match designs and add svg images ([#38](https://github.com/MetaMask/snap-7715-permissions/pull/38))
- Add correct header text for native token stream ([#40](https://github.com/MetaMask/snap-7715-permissions/pull/40))
- Update `AccountDetails` component to match designs, use `price api` for spot price and fetch user locale preferences ([#41](https://github.com/MetaMask/snap-7715-permissions/pull/41))
- Add stream amount component ([#43](https://github.com/MetaMask/snap-7715-permissions/pull/43))
- Render permission specific rules ([#45](https://github.com/MetaMask/snap-7715-permissions/pull/45))
- Register event handlers to handle permission confirmation dialog events ([#48](https://github.com/MetaMask/snap-7715-permissions/pull/48))
- Add release gh actions ([#51](https://github.com/MetaMask/snap-7715-permissions/pull/51))
- Ensure create-release-branch cli tool passes ([#54](https://github.com/MetaMask/snap-7715-permissions/pull/54))
- Add changelog scripts ([#55](https://github.com/MetaMask/snap-7715-permissions/pull/55))

[Unreleased]: https://github.com/MetaMask/snap-7715-permissions/compare/@metamask/gator-permissions-snap@0.2.0...HEAD
[0.2.0]: https://github.com/MetaMask/snap-7715-permissions/compare/@metamask/gator-permissions-snap@0.1.0...@metamask/gator-permissions-snap@0.2.0
[0.1.0]: https://github.com/MetaMask/snap-7715-permissions/compare/@metamask/gator-permissions-snap@0.0.1...@metamask/gator-permissions-snap@0.1.0
[0.0.1]: https://github.com/MetaMask/snap-7715-permissions/releases/tag/@metamask/gator-permissions-snap@0.0.1
