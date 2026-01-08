# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Uncategorized

- Update introduction content ([#245](https://github.com/MetaMask/snap-7715-permissions/pull/245))
- Convert introduction images to webp ([#244](https://github.com/MetaMask/snap-7715-permissions/pull/244))

## [0.8.0]

### Added

- An introduction shown to user explaining each permission type ([#238](https://github.com/MetaMask/snap-7715-permissions/pull/238))
- Request now times out when user doesn't respond ([#237](https://github.com/MetaMask/snap-7715-permissions/pull/237))
- New `erc-20-token-revocation` permission type ([#234](https://github.com/MetaMask/snap-7715-permissions/pull/234))

### Changed

- Expiry is now optional ([#240](https://github.com/MetaMask/snap-7715-permissions/pull/240))
- Recipient field is now shown in permission dialog ([#239](https://github.com/MetaMask/snap-7715-permissions/pull/239))
- Datetime picker used in permission dialog ([#235](https://github.com/MetaMask/snap-7715-permissions/pull/235))
- More meaningful error messages ([#232](https://github.com/MetaMask/snap-7715-permissions/pull/232))
- Initial amount is now allowed ([#230](https://github.com/MetaMask/snap-7715-permissions/pull/230))
- Default streaming period is now Monthly ([#229](https://github.com/MetaMask/snap-7715-permissions/pull/229))

### Fixed

- Resolve 0 balance when token data is returned, but not the requested token ([#241](https://github.com/MetaMask/snap-7715-permissions/pull/241))

## [0.7.0]

### Fixed

- Add zero address validation ([#226](https://github.com/MetaMask/snap-7715-permissions/pull/226))
- Fix: throw proper errors ([#225](https://github.com/MetaMask/snap-7715-permissions/pull/225))

## [0.6.1]

### Fixed

- Corrects Accounts API URL, which caused permission requests on Mainnet to fail

## [0.6.0]

### Changed

- Improves metrics generation, by including more information about the permissions being granted ([#218](https://github.com/MetaMask/snap-7715-permissions/pull/218))

## [0.5.0]

### Added

- New RPC `permissionsProvider_submitRevocation` for marking permission as revoked ([#171](https://github.com/MetaMask/snap-7715-permissions/pull/171))
- Add basic metrics generation via metrics tracking service ([#198](https://github.com/MetaMask/snap-7715-permissions/pull/198)) and ([#216](https://github.com/MetaMask/snap-7715-permissions/pull/216))
- Check, and if necessary request, upgrade to smart account ([#188](https://github.com/MetaMask/snap-7715-permissions/pull/188))

### Changed

- Removes testnet restriction, now supports all chains ([#215](https://github.com/MetaMask/snap-7715-permissions/pull/215))
- Only display "show more" button when justification long enough to be truncated ([#213](https://github.com/MetaMask/snap-7715-permissions/pull/213))
- Improve justification visibility, with improved text color ([#212](https://github.com/MetaMask/snap-7715-permissions/pull/212))
- Improve permission picker layout to be more consistent with Sign Permission confirmation ([#202](https://github.com/MetaMask/snap-7715-permissions/pull/202))

### Fixed

- Race condition on debounce events allowing validation to be bypassed (resulting in error) ([#210](https://github.com/MetaMask/snap-7715-permissions/pull/210))
- Fixed: handle dialog closure case in confirmation flow ([#195](https://github.com/MetaMask/snap-7715-permissions/pull/195))

## [0.4.1]

### Changed

- Granted permissions are no longer persisted (GitHub actions configuration change)

## [0.4.0]

### Changed

- Restrict permission requests to supported chains only (currently testnets) ([#200](https://github.com/MetaMask/snap-7715-permissions/pull/200))
  Previously removed in ([#189](https://github.com/MetaMask/snap-7715-permissions/pull/189))
- Periodic permissions durations must now be a known increment, e.g., "Hourly", "Weekly", etc. ([#190](https://github.com/MetaMask/snap-7715-permissions/pull/190))
- Permission title and subtitle reworded to be more meaningful ([#196](https://github.com/MetaMask/snap-7715-permissions/pull/196))
- Unnecessary dependency on `@metamask/delegation-toolkit` removed and `@metamask/delegation-core` bumped to "stable" release 0.2.0
- `snap.manifest.ts` version bumped to 3.0.0

### Fixed

- When `isAdjustmentAllowed` is false, the justification block is expandable, and price data also updates ([#193](https://github.com/MetaMask/snap-7715-permissions/pull/193))
- Correct error is returned when the user declines the permission request ([#191](https://github.com/MetaMask/snap-7715-permissions/pull/191))
- Expiry values are now correctly validated ([#187](https://github.com/MetaMask/snap-7715-permissions/pull/187))

## [0.3.0]

### Added

- Add hideSnapBranding flag to preinstalled snap manifest
- Add chain metadata for supported testnets
- feat: add lifecycle hooks permission for local development and refactor onInstall handler
- feat(manifest): add environment-based manifest management ([#153](https://github.com/MetaMask/snap-7715-permissions/pull/153))
- Add retry logic to all clients
- Add priceApi response validation
- Add account API client validation and fetch timeout
- feat(ui): add TokenBalanceField component for displaying token balances ([#142](https://github.com/MetaMask/snap-7715-permissions/pull/142))
- feat(ui): add TokenField component for displaying token info ([#136](https://github.com/MetaMask/snap-7715-permissions/pull/136))
- Allow user to select EOA from which to grant the permission ([#125](https://github.com/MetaMask/snap-7715-permissions/pull/125))
- Add the nonce enforcer as a default caveat for all permissions ([#127](https://github.com/MetaMask/snap-7715-permissions/pull/127))
- Async confirmation ([#114](https://github.com/MetaMask/snap-7715-permissions/pull/114))
- Add new permissionsProvider_getGrantedPermissions RPC ([#108](https://github.com/MetaMask/snap-7715-permissions/pull/108))
- Add `erc-20-token-periodic` permission type ([#106](https://github.com/MetaMask/snap-7715-permissions/pull/106))
- Allow setting SUPPORTED_CHAINS, and GATSBY_SUPPORTED_CHAINS (for site package). ([#105](https://github.com/MetaMask/snap-7715-permissions/pull/105))
- Add support for token icons ([#104](https://github.com/MetaMask/snap-7715-permissions/pull/104))
- Add valueLTE caveat to erc20 streaming permission ([#103](https://github.com/MetaMask/snap-7715-permissions/pull/103))
- Feat/ephemeral permission offer registry ([#101](https://github.com/MetaMask/snap-7715-permissions/pull/101))
- Add `erc20-token-stream` permission ([#100](https://github.com/MetaMask/snap-7715-permissions/pull/100))
- Fetch token metadata ([#99](https://github.com/MetaMask/snap-7715-permissions/pull/99))
- Add `native-token-periodic` permission ([#89](https://github.com/MetaMask/snap-7715-permissions/pull/89))
- Add iconAltText to rule icon data
- Add close icon for the input fields
- Add token logo for the input fields
- feat: add native token periodic permission type and handler
- Add tests for ruleModalManager and rules
- Add rules abstraction, somewhat shoehorned into existing baseOrchestrator

### Changed

- Order numerically testnet metadatas
- Provide metadata when signing delegation ([#169](https://github.com/MetaMask/snap-7715-permissions/pull/169))
- Rename RCP Urls To Be Consistent ([#168](https://github.com/MetaMask/snap-7715-permissions/pull/168))
- Refactor getTokenBalance to return bigint zero using 0n and optimize address comparison
- When signing the delegation with eth_signTypedData, provide origin and justification in metadata property on EIP-712 payload
- chore: changed to plural refereces of permissionProvider
- chore: rename rpc urls to be consistent
- feat: remove local development hooks and add InstallButton component
- Disable logging in production ([#161](https://github.com/MetaMask/snap-7715-permissions/pull/161))
- update headers setup for account API and balance formating
- Better makeValidatedRequestWithRetry typings
- clear timeout move to finally block
- account api v2
- refactor retry http logic into helper function
- Schema address validation updates, naming updates and creating httpClient utils to merge duplicating code
- Process permission requests sequentially ([#150](https://github.com/MetaMask/snap-7715-permissions/pull/150))
- try caipAssetType normal and case insesitive lookup as fallback
- chore: remove 'viem' dependency from package.json and related files ([#154](https://github.com/MetaMask/snap-7715-permissions/pull/154))
- Use null where appropriate ([#143](https://github.com/MetaMask/snap-7715-permissions/pull/143))
- refactor(core): validate chain support early in permission request ([#145](https://github.com/MetaMask/snap-7715-permissions/pull/145))
- Change generic errors with snap errors ([#135](https://github.com/MetaMask/snap-7715-permissions/pull/135))
- switch expiry and startTime types to number since we are expecting a timestamp ([#139](https://github.com/MetaMask/snap-7715-permissions/pull/139))
- Update shasum, in preparation for merge to main ([#137](https://github.com/MetaMask/snap-7715-permissions/pull/137))
- Chore/integrate new permission types ([#134](https://github.com/MetaMask/snap-7715-permissions/pull/134))
- Update architecture doc to reflect updated architecture ([#133](https://github.com/MetaMask/snap-7715-permissions/pull/133))
- Update homepage to remove reference to Smart Contract Account. ([#131](https://github.com/MetaMask/snap-7715-permissions/pull/131))
- Return unbind handler when calling `UserEventDispatcher.on()` ([#132](https://github.com/MetaMask/snap-7715-permissions/pull/132))
- Update input validation ([#110](https://github.com/MetaMask/snap-7715-permissions/pull/110))
- Refactor: extract common field components into reusable Field component ([#122](https://github.com/MetaMask/snap-7715-permissions/pull/122))
- Better handle date time ([#115](https://github.com/MetaMask/snap-7715-permissions/pull/115))
- Remove add more rules modal, and replace it with a simple toggle ([#120](https://github.com/MetaMask/snap-7715-permissions/pull/120))
- style: update component class definition to include text color
- style: fix indentation in package.json files and docs
- build: downgrade @types/react from 18.3.23 to 18.2.4
- execute handlers sequentially and function rename
- Make sure events are processes sequentially and that all events are proccessed before granting permission
- make justification optional and show default message in this case
- Update linter rule for empty line is js docs and update comments to have an empty line
- Update message-signing-snap dependency to 1.1.3
- Reduce usage of @metamask/delegation-toolkit and viem ([#107](https://github.com/MetaMask/snap-7715-permissions/pull/107))
- Update snapshots due to layout changes
- Bump the npm_and_yarn group across 1 directory with 3 updates ([#78](https://github.com/MetaMask/snap-7715-permissions/pull/78))
- refactor: reduce boilerplate in permission definitions
- Improve asynchronicity when resolving context for period permissions. Fix various linting issues.
- Use dropdown + explicit seconds for selecting the period duration
- Update packages/gator-permissions-snap/src/permissions/nativeTokenPeriodic/caveats.ts
- Move confirmation wrapper into shared permissionHandlerContent.tsx - title - add more rules button
- Move ruleManager, permissionHandler, ruleModalManager to core
- Remove defunct handlers from confirmation
- Implement handler pattern: - decouple handler out of orchestrator - update naming throughout handlers and orchestrators to be more consistent
- Remove shared rules, move expiry rule back into native token stream
- refactor: extract shared expiry rule, remove defunct permissions/types.ts
- Update tests to match implementation
- Standardise some naming
- Enable linting of tsx files in gator-permissions. Auto fix linting problems.
- Move allSupportedChains itno BaseAccountController as private static member
- Improve profile sync dev experience ([#86](https://github.com/MetaMask/snap-7715-permissions/pull/86))

### Removed

- Remove endowment lifecycle hooks ([#164](https://github.com/MetaMask/snap-7715-permissions/pull/164))
- Remove development constants from production artifacts ([#148](https://github.com/MetaMask/snap-7715-permissions/pull/148))
- Remove unused code and images ([#111](https://github.com/MetaMask/snap-7715-permissions/pull/111))

### Fixed

- Fix Polygon Amoy Testnet incorrectly attributed as Metis Sepolia. Rename BNB to BNB Smart Chain.
- fix: remove conditional iconUrl assignment in getTokenMetadata response
- fix: sanitize icon URL in token metadata response
- Missing runtime verification for api responses ([#158](https://github.com/MetaMask/snap-7715-permissions/pull/158))
- fix mock interfearance in tests
- fix: TokenIcon runtime type enforcement ([#155](https://github.com/MetaMask/snap-7715-permissions/pull/155))
- Missing runtime schema verification for profile sync store/retrieve ([#157](https://github.com/MetaMask/snap-7715-permissions/pull/157))
- Fix misleading debug message ([#156](https://github.com/MetaMask/snap-7715-permissions/pull/156))
- feat: Incorrect token currency shown ([#152](https://github.com/MetaMask/snap-7715-permissions/pull/152))
- Handle Price API errors ([#146](https://github.com/MetaMask/snap-7715-permissions/pull/146))
- fix(gator-permissions-snap): fix return type for account addresses ([#141](https://github.com/MetaMask/snap-7715-permissions/pull/141))
- Validation errors disables grant button ([#126](https://github.com/MetaMask/snap-7715-permissions/pull/126))
- Improve ERC20 token parsing error and fix fetching bug ([#124](https://github.com/MetaMask/snap-7715-permissions/pull/124))
- EOAAccountController should serialize delegation salt as bigint when calling eth_signTypedData_v4 ([#116](https://github.com/MetaMask/snap-7715-permissions/pull/116))
- address potential race condition
- Fix typos ([#98](https://github.com/MetaMask/snap-7715-permissions/pull/98))

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

[Unreleased]: https://github.com/MetaMask/snap-7715-permissions/compare/@metamask/gator-permissions-snap@0.8.0...HEAD
[0.8.0]: https://github.com/MetaMask/snap-7715-permissions/compare/@metamask/gator-permissions-snap@0.7.0...@metamask/gator-permissions-snap@0.8.0
[0.7.0]: https://github.com/MetaMask/snap-7715-permissions/compare/@metamask/gator-permissions-snap@0.6.1...@metamask/gator-permissions-snap@0.7.0
[0.6.1]: https://github.com/MetaMask/snap-7715-permissions/compare/@metamask/gator-permissions-snap@0.6.0...@metamask/gator-permissions-snap@0.6.1
[0.6.0]: https://github.com/MetaMask/snap-7715-permissions/compare/@metamask/gator-permissions-snap@0.5.0...@metamask/gator-permissions-snap@0.6.0
[0.5.0]: https://github.com/MetaMask/snap-7715-permissions/compare/@metamask/gator-permissions-snap@0.4.1...@metamask/gator-permissions-snap@0.5.0
[0.4.1]: https://github.com/MetaMask/snap-7715-permissions/compare/@metamask/gator-permissions-snap@0.4.0...@metamask/gator-permissions-snap@0.4.1
[0.4.0]: https://github.com/MetaMask/snap-7715-permissions/compare/@metamask/gator-permissions-snap@0.3.0...@metamask/gator-permissions-snap@0.4.0
[0.3.0]: https://github.com/MetaMask/snap-7715-permissions/compare/@metamask/gator-permissions-snap@0.2.1...@metamask/gator-permissions-snap@0.3.0
[0.2.1]: https://github.com/MetaMask/snap-7715-permissions/compare/@metamask/gator-permissions-snap@0.2.0...@metamask/gator-permissions-snap@0.2.1
[0.2.0]: https://github.com/MetaMask/snap-7715-permissions/compare/@metamask/gator-permissions-snap@0.1.0...@metamask/gator-permissions-snap@0.2.0
[0.1.0]: https://github.com/MetaMask/snap-7715-permissions/compare/@metamask/gator-permissions-snap@0.0.1...@metamask/gator-permissions-snap@0.1.0
[0.0.1]: https://github.com/MetaMask/snap-7715-permissions/releases/tag/@metamask/gator-permissions-snap@0.0.1
