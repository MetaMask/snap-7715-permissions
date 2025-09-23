# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0]

### Uncategorized

- Add hideSnapBranding flag to preinstalled snap manifest
- Order numerically testnet metadatas
- Fix Polygon Amoy Testnet incorrectly attributed as Metis Sepolia. Rename BNB to BNB Smart Chain.
- Add chain metadata for supported testnets
- Provide metadata when signing delegation ([#169](https://github.com/MetaMask/snap-7715-permissions/pull/169))
- Rename RCP Urls To Be Consistent ([#168](https://github.com/MetaMask/snap-7715-permissions/pull/168))
- Refactor getTokenBalance to return bigint zero using 0n and optimize address comparison
- Merge branch 'main' into feat/account-api-v2
- When signing the delegation with eth_signTypedData, provide origin and justification in metadata property on EIP-712 payload
- chore: changed to plural refereces of permissionProvider
- Remove endowment lifecycle hooks ([#164](https://github.com/MetaMask/snap-7715-permissions/pull/164))
- chore: rename rpc urls to be consistent
- fix: remove conditional iconUrl assignment in getTokenMetadata response
- fix: sanitize icon URL in token metadata response
- feat: remove local development hooks and add InstallButton component
- Merge branch 'dev' into feat/account-api-v2
- Missing runtime verification for api responses ([#158](https://github.com/MetaMask/snap-7715-permissions/pull/158))
- feat: add lifecycle hooks permission for local development and refactor onInstall handler
- Disable logging in production ([#161](https://github.com/MetaMask/snap-7715-permissions/pull/161))
- fix mock interfearance in tests
- feat(manifest): add environment-based manifest management ([#153](https://github.com/MetaMask/snap-7715-permissions/pull/153))
- tests upadate
- update headers setup for account API and balance formating
- Merge branch 'feat/retry-logic' of github.com:MetaMask/snap-7715-permissions into feat/account-api-v2
- Better makeValidatedRequestWithRetry typings
- Merge branch '6.3-Gator---Missing-Runtime-Verification-for-API-Responses' of github.com:MetaMask/snap-7715-permissions into feat/retry-logic
- clear timeout move to finally block
- fix: TokenIcon runtime type enforcement ([#155](https://github.com/MetaMask/snap-7715-permissions/pull/155))
- account api v2
- refactor retry http logic into helper function
- Merge branch '6.3-Gator---Missing-Runtime-Verification-for-API-Responses' of github.com:MetaMask/snap-7715-permissions into feat/retry-logic
- Missing runtime schema verification for profile sync store/retrieve ([#157](https://github.com/MetaMask/snap-7715-permissions/pull/157))
- rename method
- Schema address validation updates, naming updates and creating httpClient utils to merge duplicating code
- test fix
- Add retry logic to all clients
- Fix misleading debug message ([#156](https://github.com/MetaMask/snap-7715-permissions/pull/156))
- Process permission requests sequentially ([#150](https://github.com/MetaMask/snap-7715-permissions/pull/150))
- try caipAssetType normal and case insesitive lookup as fallback
- Add priceApi response validation
- Add account API client validation and fetch timeout
- chore: remove 'viem' dependency from package.json and related files ([#154](https://github.com/MetaMask/snap-7715-permissions/pull/154))
- feat: Incorrect token currency shown ([#152](https://github.com/MetaMask/snap-7715-permissions/pull/152))
- Remove development constants from production artifacts ([#148](https://github.com/MetaMask/snap-7715-permissions/pull/148))
- feat(ui): add TokenBalanceField component for displaying token balances ([#142](https://github.com/MetaMask/snap-7715-permissions/pull/142))
- Use null where appropriate ([#143](https://github.com/MetaMask/snap-7715-permissions/pull/143))
- refactor(core): validate chain support early in permission request ([#145](https://github.com/MetaMask/snap-7715-permissions/pull/145))
- Handle Price API errors ([#146](https://github.com/MetaMask/snap-7715-permissions/pull/146))
- Change generic errors with snap errors ([#135](https://github.com/MetaMask/snap-7715-permissions/pull/135))
- switch expiry and startTime types to number since we are expecting a timestamp ([#139](https://github.com/MetaMask/snap-7715-permissions/pull/139))
- fix(gator-permissions-snap): fix return type for account addresses ([#141](https://github.com/MetaMask/snap-7715-permissions/pull/141))
- Update shasum, in preparation for merge to main ([#137](https://github.com/MetaMask/snap-7715-permissions/pull/137))
- Chore/integrate new permission types ([#134](https://github.com/MetaMask/snap-7715-permissions/pull/134))
- feat(ui): add TokenField component for displaying token info ([#136](https://github.com/MetaMask/snap-7715-permissions/pull/136))
- Update architecture doc to reflect updated architecture ([#133](https://github.com/MetaMask/snap-7715-permissions/pull/133))
- Update homepage to remove reference to Smart Contract Account. ([#131](https://github.com/MetaMask/snap-7715-permissions/pull/131))
- Return unbind handler when calling `UserEventDispatcher.on()` ([#132](https://github.com/MetaMask/snap-7715-permissions/pull/132))
- Allow user to select EOA from which to grant the permission ([#125](https://github.com/MetaMask/snap-7715-permissions/pull/125))
- Update input validation ([#110](https://github.com/MetaMask/snap-7715-permissions/pull/110))
- Refactor: extract common field components into reusable Field component ([#122](https://github.com/MetaMask/snap-7715-permissions/pull/122))
- Add the nonce enforcer as a default caveat for all permissions ([#127](https://github.com/MetaMask/snap-7715-permissions/pull/127))
- Better handle date time ([#115](https://github.com/MetaMask/snap-7715-permissions/pull/115))
- Validation errors disables grant button ([#126](https://github.com/MetaMask/snap-7715-permissions/pull/126))
- Improve ERC20 token parsing error and fix fetching bug ([#124](https://github.com/MetaMask/snap-7715-permissions/pull/124))
- Remove add more rules modal, and replace it with a simple toggle ([#120](https://github.com/MetaMask/snap-7715-permissions/pull/120))
- style: update component class definition to include text color
- style: fix indentation in package.json files and docs
- build: downgrade @types/react from 18.3.23 to 18.2.4
- EOAAccountController should serialize delegation salt as bigint when calling eth_signTypedData_v4 ([#116](https://github.com/MetaMask/snap-7715-permissions/pull/116))
- update error message
- update manifest
- Merge branch 'main' of https://github.com/MetaMask/snap-7715-permissions into chore/justification-sanitation
- manifest update
- import order fix
- Merge branch 'main' of https://github.com/MetaMask/snap-7715-permissions into chore/sequentialEventHandling
- manifest update
- fix import order
- Merge branch 'main' of https://github.com/MetaMask/snap-7715-permissions into chore/dependency-updates
- Async confirmation ([#114](https://github.com/MetaMask/snap-7715-permissions/pull/114))
- execute handlers sequentially and function rename
- address potential race condition
- update docs
- update snap manifest
- Make sure events are processes sequentially and that all events are proccessed before granting permission
- update manifest
- linter fixes
- update manifest
- make justification optional and show default message in this case
- Update linter rule for empty line is js docs and update comments to have an empty line
- update manifest
- Merge branch 'main' of https://github.com/MetaMask/snap-7715-permissions into chore/dependency-updates
- Merge branch 'main' of https://github.com/MetaMask/snap-7715-permissions into chore/justification-sanitation
- Add new permissionsProvider_getGrantedPermissions RPC ([#108](https://github.com/MetaMask/snap-7715-permissions/pull/108))
- Merge branch 'main' of https://github.com/MetaMask/snap-7715-permissions into chore/justification-sanitation
- update snap manifest
- linter fixes
- Update snap manifest
- Merge branch 'main' of https://github.com/MetaMask/snap-7715-permissions into chore/dependency-updates
- Update message-signing-snap dependency to 1.1.3
- Remove unused code and images ([#111](https://github.com/MetaMask/snap-7715-permissions/pull/111))
- bump major version on dependencies
- update node version, bump dependencies
- Reduce usage of @metamask/delegation-toolkit and viem ([#107](https://github.com/MetaMask/snap-7715-permissions/pull/107))
- Add `erc-20-token-periodic` permission type ([#106](https://github.com/MetaMask/snap-7715-permissions/pull/106))
- Allow setting SUPPORTED_CHAINS, and GATSBY_SUPPORTED_CHAINS (for site package). ([#105](https://github.com/MetaMask/snap-7715-permissions/pull/105))
- Add support for token icons ([#104](https://github.com/MetaMask/snap-7715-permissions/pull/104))
- Add valueLTE caveat to erc20 streaming permission ([#103](https://github.com/MetaMask/snap-7715-permissions/pull/103))
- Feat/ephemeral permission offer registry ([#101](https://github.com/MetaMask/snap-7715-permissions/pull/101))
- Add `erc20-token-stream` permission ([#100](https://github.com/MetaMask/snap-7715-permissions/pull/100))
- Fetch token metadata ([#99](https://github.com/MetaMask/snap-7715-permissions/pull/99))
- Fix issue where accountMeta was not being included on the response object correctly. ([#95](https://github.com/MetaMask/snap-7715-permissions/pull/95))
- Add `native-token-periodic` permission ([#89](https://github.com/MetaMask/snap-7715-permissions/pull/89))
- Fix typos ([#98](https://github.com/MetaMask/snap-7715-permissions/pull/98))
- Update snapshots due to layout changes
- Merge branch 'main' into feat/native-token-periodic
- Merge branch 'main' into feat/native-token-periodic
- Add iconAltText to rule icon data
- Bump the npm_and_yarn group across 1 directory with 3 updates ([#78](https://github.com/MetaMask/snap-7715-permissions/pull/78))
- refactor: reduce boilerplate in permission definitions
- Improve asynchronicity when resolving context for period permissions. Fix various linting issues.
- Fix failing test
- Fix lint error
- Fix merge conflict
- Use dropdown + explicit seconds for selecting the period duration
- Fix failing test
- Add close icon for the input fields
- Add token logo for the input fields
- Update packages/gator-permissions-snap/src/permissions/nativeTokenPeriodic/caveats.ts
- feat: add native token periodic permission type and handler
- Move confirmation wrapper into shared permissionHandlerContent.tsx - title - add more rules button
- Move ruleManager, permissionHandler, ruleModalManager to core
- Update documentation
- Fix linting
- Remove defunct handlers from confirmation
- Implement handler pattern: - decouple handler out of orchestrator - update naming throughout handlers and orchestrators to be more consistent
- Fix those tests
- Remove shared rules, move expiry rule back into native token stream
- Fix linting: - add eslint packages to packages - fix linting errors in gator permissions snap
- refactor: extract shared expiry rule, remove defunct permissions/types.ts
- Add tests for ruleModalManager and rules
- Update tests to match implementation
- Standardise some naming
- Add rules abstraction, somewhat shoehorned into existing baseOrchestrator
- Try again to fix shasum
- Fix shasum
- Manual fixes to linting errors
- Enable linting of tsx files in gator-permissions. Auto fix linting problems.
- Move allSupportedChains itno BaseAccountController as private static member
- Fix environment variable parsing
- Merge main
- Improve profile sync dev experience ([#86](https://github.com/MetaMask/snap-7715-permissions/pull/86))

## [0.2.1]

### Fixed

- Switch the tg link out to correct link ([#80](https://github.com/MetaMask/snap-7715-permissions/pull/80))

## [0.2.0]

### Fixed

- Fix number formatting for rules to not truncate decimal places ([#74](https://github.com/MetaMask/snap-7715-permissions/pull/74))
- Allow initialAmount and maxAllowance to be unspecified ([#75](https://github.com/MetaMask/snap-7715-permissions/pull/75))

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

[Unreleased]: https://github.com/MetaMask/snap-7715-permissions/compare/@metamask/gator-permissions-snap@0.3.0...HEAD
[0.3.0]: https://github.com/MetaMask/snap-7715-permissions/compare/@metamask/gator-permissions-snap@0.2.1...@metamask/gator-permissions-snap@0.3.0
[0.2.1]: https://github.com/MetaMask/snap-7715-permissions/compare/@metamask/gator-permissions-snap@0.2.0...@metamask/gator-permissions-snap@0.2.1
[0.2.0]: https://github.com/MetaMask/snap-7715-permissions/compare/@metamask/gator-permissions-snap@0.1.0...@metamask/gator-permissions-snap@0.2.0
[0.1.0]: https://github.com/MetaMask/snap-7715-permissions/compare/@metamask/gator-permissions-snap@0.0.1...@metamask/gator-permissions-snap@0.1.0
[0.0.1]: https://github.com/MetaMask/snap-7715-permissions/releases/tag/@metamask/gator-permissions-snap@0.0.1
