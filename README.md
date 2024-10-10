Venly Web3 Provider<img align="right" src="https://github.com/Venly.png?size=30" />
===

> The Venly Web3 provider is a smart wrapper around the existing Web3 Ethereum JavaScript API.

If you already have an application running using web3 technology, you can make use of this wrapper to leverage the full potential of Venly Wallet API.
Your existing infrastructure is just one code block away from being **Venly Wallet Enabled**.

![Venly Components](https://i.imgur.com/T5sWhZa.png)

# Documentation
* [Changelog](https://github.com/Venly/web3-arkane-provider/blob/develop/CHANGELOG.md)
* [Venly Docs](https://docs.venly.io/widget/web3-provider/getting-started)

## Adding the library

Install and import the module in your project

```bash
npm i @venly/web3-provider
```

```javascript
import { VenlyProvider } from "@venly/web3-provider";
```

Alternatively, you can load our script from one of the following CDNs

```html
<script src="https://unpkg.com/@venly/web3-provider/umd/index.js"></script>
```

```html
<script src="https://cdn.jsdelivr.net/npm/@venly/web3-provider/umd/index.js"></script>
```

## Using the Library

```javascript
const Venly = new VenlyProvider();
```

The VenlyProvider object is the gateway for creating the web3 wrapper and fully integrates [Venly Connect](https://docs.venly.io/widget/widget/introduction).

### Adding the web3 provider (web3.js)

```javascript
const options: VenlyProviderOptions = {
  clientId: 'YOUR_CLIENT_ID',
  environment: 'sandbox', //optional, defaults to production  
  secretType: SecretType.ETHEREUM, //optional, defaults to ETHEREUM  
  windowMode: WindowMode.POPUP, //optional, defaults to POPUP
  bearerTokenProvider: () => 'obtained_bearer_token', //optional
  skipAuthentication: false //optional, defaults to false
};

const provider = await Venly.createProvider(options);
const web3 = new Web3(provider);
```

The web3 instance now works as if it was [injected by parity or metamask](https://github.com/ethereum/wiki/wiki/JavaScript-API). You can fetch your wallets or sign transactions and messages. 

If you provide your own implementation of `bearerTokenProvider`, the web3 provider will not attempt to obtain an authentication code, but rather use the one provided by you.

### Usage with ethers.js

Use the Web3Provider class to wrap our existing Web3-compatible provider and expose it as an ethers.js Provider. (Requires ethers.js v5)

```javascript
const options = {
  clientId: 'YOUR_CLIENT_ID'
};

const provider = await Venly.createProvider(options);
const ethers = new ethers.providers.Web3Provider(provider);
```

### Using Venly Connect natively

After initializing the Venly Provider, an instance of **VenlyConnect** is added to the **Venly** object. As a result, it's possible to call Venly Connect natively.

```
Venly.connect.getProfile();
```

The full documentation for Venly Connect can be found here: https://docs.venly.io/widget/widget/introduction

## Build Environments

Many of required dependencies are not normally included in browser builds (namely the node built-in modules such as `crypto`, `buffer`, `util` etc). If you are having build issues you can try the following bundler configs to resolve these dependency issues:

#### Create-React-App

[React App Rewired](https://www.npmjs.com/package/react-app-rewired) provides a simple way to override webpack config which is obfuscated in Create React App built applications.

Add the following dev dependencies:
`npm i --save-dev assert buffer crypto-browserify stream-http https-browserify process stream-browserify url browserify-zlib`

**OR**

`yarn add assert buffer crypto-browserify stream-http https-browserify process stream-browserify url browserify-zlib -D`

Create a `config-overrides.js` file in the root directory:

```javascript copy
const webpack = require('webpack')

module.exports = function override(config) {
  const fallback = config.resolve.fallback || {}
  Object.assign(fallback, {
    assert: require.resolve('assert'),
    buffer: require.resolve('buffer'),
    crypto: require.resolve('crypto-browserify'),
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    process: require.resolve('process/browser'),
    stream: require.resolve('stream-browserify'),
    url: require.resolve('url'),
    zlib: require.resolve('browserify-zlib')
  })
  config.resolve.fallback = fallback
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer']
    })
  ])
  config.ignoreWarnings = [/Failed to parse source map/]
  config.module.rules.push({
    test: /\.(js|mjs|jsx)$/,
    enforce: 'pre',
    loader: require.resolve('source-map-loader'),
    resolve: {
      fullySpecified: false
    }
  })
  return config
}
```

# Example Project
We've created two examples of the Web3 Provider in our demo application.

One only checks authentication and shows the login form after the user clicks a button:
* [Web3 Provider Demo](https://demo.arkane.network/pages/web3-provider)
* [Web3 Provider Demo html source](https://github.com/Venly/Arketype/blob/develop/pages/web3-provider.html)
* [Web3 Provider JS source](https://github.com/Venly/Arketype/blob/develop/assets/js/web3-provider.js)

The other checks if a user is logged in on page load. If not, it shows the login button, otherwise it fetches the users' wallets:
* [Web3 Provider (skip auth) Demo](https://demo.arkane.network/pages/web3-provider-skip-auth)
* [Web3 Provider (skip auth) Demo html source](https://github.com/Venly/Arketype/blob/develop/pages/web3-provider-skip-auth.html)
* [Web3 Provider (skip auth) JS source](https://github.com/Venly/Arketype/blob/develop/assets/js/web3-provider-skip-auth.js)

# What is Venly Wallet
Not sure yet what Venly is all about? Be sure to check out our website: https://www.venly.io/
