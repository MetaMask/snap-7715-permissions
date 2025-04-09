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
- feat: update `AccountDetails` component to match designs, use `price api` for spot price and fetch user locale preferences ([#41](https://github.com/MetaMask/snap-7715-permissions/pull/41))
- Revery yarn.lock and rebuild
- Fix call to grantPermissions
- Make permission singular
- Enable linting of tsx in site package. Ensure locally installed version of eslint is used. Disable no-restricted-globals, because we love restricted-global in the site package.
- Update manifest
- Fix linting
- Make linting run individual module lint commands instead of global linting. Resolve inconsistency with lint execution. Resolve linting errors in .tsx files (previously skipped).
- feat: Add validate logic for native token stream permission data ([#33](https://github.com/MetaMask/snap-7715-permissions/pull/33))
- update 7715 types to match mm proposed types ([#30](https://github.com/MetaMask/snap-7715-permissions/pull/30))
- fix merge conflicts
- fix merge conflict
- fix merge conflicts
- add pr comments
- add test coverage
- simplify orchestrator
- Update manifest checksum :/
- fix merge conflicts
- Introduce entrypoint, RpcHandler, simplify placeholder confirmation. Simplify MockSnapProvider.
- fix merge conflict
- wire up native token stream orchestrate e2e with mock results
- Update manifests
- Merge branch 'main' into feat/account-controller
- Update manifest
- fix shasum
- Merge branch 'chore/cleanup-permission-provider-snap' of github.com:MetaMask/snap-7715-permissions into create-specific-permission-orchestrators-interface
- address pr comments
- Put back in changes to kernel. Add comment. Remove testing code.
- Upgrade delegator sdk. Add SignTypedDataAdapter. ExperimentalProviderRequest now works.
- sync shasum
- create permission orchestrator interface with generic factory
- Working towards testing the account controller in the extension
- Initial commit noodling with account controller
- fix shasum
- remove ts paths and use yarn workspaces
- add test case for permission provider snap
- allow test in shared
- use beforeEach to install snap for e2e test setup
- fix yarn lock issue
- tell Jest how to resolve mm shard package paths
- address more pr comments
- address pr comments
- add test coverage for logger
- fix lint errors
- more test coverage for kernel
- add more e2e test for unhappy path
- fix 7715 permissions types
- update e2e test mocks
- hardcode SNAP_ENV in build workflow
- fix failing build and lint workflows
- update workflow to handle 2 snaps
- update readme
- fix e2e permissions request, fix failing lint and test
- bring in kernel and gator snap

### Added

- Add kernel and gator snap ([#13](https://github.com/MetaMask/snap-7715-permissions/pull/13))

### Changed

- Improve test coverage for kernel snap ([#18](https://github.com/MetaMask/snap-7715-permissions/pull/18))

[Unreleased]: git+https://github.com/MetaMask/snap-7715-permissions/compare/@metamask/permissions-kernel@0.0.1...HEAD
[0.0.1]: git+https://github.com/MetaMask/snap-7715-permissions/releases/tag/@metamask/permissions-kernel@0.0.1
