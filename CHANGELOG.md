# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
