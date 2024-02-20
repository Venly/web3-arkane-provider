# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.3.4]
### Fixed
- Update `@venly/connect` to 2.3.5
  - Fixes issue with `windowMode` being overwritten by deprecated `signUsing` option

## [3.3.3]
### Fixed
- Update `@venly/connect` to 2.3.2
  - Fixes issue with `executeNativeTransaction()` not opening popup

## [3.3.2]
### Changed
- Rename exported `SECRET_TYPES` to `CHAIN_CONFIGS`

### Fixed
- Update `@venly/connect` to 2.3.1
  - Fixes issue with popup staying open during `getAccounts()`

## [3.3.1]
### Changed
- Update `chainId` to reflect change from Etherum Goerli -> Ethereum Sepolia

## [3.3.0]
### Added
- Attach bearer token to fetch calls made by RPC middleware

## [3.2.4]
### Fixed
- Fix issue with login url in prod environment

## [3.2.0]
### Added
- Add section on build environments to README

## [3.1.3]
### Added
- Provider emits `'disconnect'` event on logout. Can be captured using `provider.on('disconnect', callback)`
- Added `sandbox` environment

## [3.1.1]
### Changed
- `wallet_switchEthereumChain` RPC method and `switchSecretType()` no longer require reinitializing the provider.

## [3.0.0]
### Added
- Built using `json-rpc-engine` instead of the deprecated `web3-provider-engine`
- Implement `provider.request` method from [EIP-1193](https://eips.ethereum.org/EIPS/eip-1193)
- Added `wallet_switchEthereumChain` method
- Added `options.authenticationOptions.closePopup` option. If set to false, Venly popup will be kept open after authenticating.
  - For cases when you need to perform an action immediately after authenticating (such as signing a message)

### Changed
- **BREAKING:** Rename class from `VenlySubProvider` to `VenlyProvider`
- **BREAKING:** Rename options from `VenlySubProviderOptions` to `VenlyProviderOptions`
- **BREAKING:** Rename method from `createProviderEngine` to `createProvider`
- `options.skipAuthentication` is now an optional parameter that defaults to false
- `options.windowMode` now defaults to `WindowMode.POPUP`

### Removed
- Remove `options.signMethod` as it has been deprecated for awhile. Use `options.windowMode` instead
- Remove `options.pollingInterval`

## [2.0.0]
### Added
- Added support for ethers.js
  - Use `ethers.providers.Web3Provider(provider)` with created provider object
