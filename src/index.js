const ArkaneSubProvider = require('./arkane-sub-provider');
const ProviderEngine = require("web3-provider-engine");
const FiltersSubprovider = require('web3-provider-engine/subproviders/filters.js');
const ProviderSubprovider = require("web3-provider-engine/subproviders/provider.js");
const Web3 = require("web3");

function ArkaneProvider({
                          apiKey,
                          baseUrl = 'https://api.arkane.network',
                          providerUrl = 'http://localhost:8545'
                        }) {

  this.arkaneSubProvider = new ArkaneSubProvider(apiKey, baseUrl);

  this.engine = new ProviderEngine();
  this.engine.addProvider(this.arkaneSubProvider);
  this.engine.addProvider(new FiltersSubprovider());
  this.engine.addProvider(new ProviderSubprovider(new Web3.providers.HttpProvider(providerUrl)));
  this.engine.start();
}

ArkaneProvider.prototype.sendAsync = function () {
  this.engine.sendAsync.apply(this.engine, arguments);
};

ArkaneProvider.prototype.send = function () {
  return this.engine.send.apply(this.engine, arguments);
};

// returns the address of the given address_index, first checking the cache
ArkaneProvider.prototype.getAddress = function (idx) {
  return this.arkaneSubProvider.address;
};

// returns the addresses cache
ArkaneProvider.prototype.getAddresses = function () {
  return [this.arkaneSubProvider.address];
};

module.exports = ArkaneProvider;