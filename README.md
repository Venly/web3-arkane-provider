Arkane Web3 Provider<img align="right" src="https://github.com/ArkaneNetwork.png?size=30" />
===

> The Arkane Web3 provider is a smart wrapper around the existing Web3 Ethereum JavaScript API.

If you already have an application running using web3 technology, you can make use of this wrapper to leverage the full potential of Arkane Network. 
Your existing infrastructure is just one code block away from being **Arkane Enabled**.

![Arkane Components](https://i.imgur.com/T5sWhZa.png)

# Getting Started

## Adding the library
```bash
npm i @arkane-network/web3-arkane-provider
```

Add the following script to the head of your page:

```html
<script src="/node_modules/@arkane-network/web3-arkane-provider/dist/web3-arkane-provider.js"></script>
```

## Using the Library

After adding the javascript file to your page, a global *Arkane* object is added to your window. This object is the gateway for creating the web3 wrapper and fully integrates the [Arkane Connect JS SDK](https://docs.arkane.network/pages/connect-js.html).

### Adding the web3 provider

```javascript

const options = {
  clientId: 'YOUR_CLIENT_ID',
  rpcUrl: 'https://kovan.infura.io/v3/YOUR-PROJECT-ID', //optional
  environment: 'staging', //optional, production by default  
  signMethod: 'POPUP', //optional, REDIRECT by default
  bearerTokenProvider: () => 'obtained_bearer_token' //optional, default undefined
};
Arkane.createArkaneProviderEngine(options).then(provider => {
    web3 = new Web3(provider);
  });
```

The web3 instance now works as if it was [injected by parity or metamask](https://github.com/ethereum/wiki/wiki/JavaScript-API). You can fetch your wallets or sign transactions and messages. 

If you provide your own implementation of `bearerTokenProvider`, the web3 provider will not attempt to obtain an authentication code, but rather use the one provided by you.

### Using Arkane Connect JS natively

Although we use Arkane Connect JS under the hood, the functionality of the web3 wrapper isn't limited to the web3 API. Linking or fetching profile information is not supported by Web3, but it is in our wrapper.
After creating an Arkane Provider Engine, we add an instance of **ArkaneConnect** to the global **Arkane** object. As a result, it's possible to call Arkane Connect JS natively, like so.

```
Arkane.arkaneConnect().linkWallets();
```

[The full documentation of the Arkane Connect JS SDK can be found here.](https://docs.arkane.network/pages/connect-js.html)

# Example Project

[As an example](https://github.com/ArkaneNetwork/web3-arkane-provider-example), we transformed our *Arketype* demo to sign transactions and data using web3. 

# What is Arkane Network
Not sure yet what Arkane Network is all about, where are some resources to help you get a better view:
* [An eli5 about Arkane](https://medium.com/arkane-network/eli5-arkane-network-44bb10d0e68f)
* [What is Arkane and what can it do for me?](https://medium.com/arkane-network/what-is-arkane-network-ad536e9984a1)
* [Our wallet security explained](https://medium.com/arkane-network/wallet-security-explained-5b540d746583)
* [I'm a developer what can Arkane do for me? (Watch video)](https://www.youtube.com/watch?&v=fsBZg450drQ)
* [I'm a crypto-enthusiast: what can Arkane do for me? (Watch video)](https://www.youtube.com/watch?v=XIAi4lFcolo)

[![alt text](https://i.imgur.com/L1ZDzlH.png)](https://www.youtube.com/watch?&v=fsBZg450drQ " I’m a developer: what can Arkane do for me?")

