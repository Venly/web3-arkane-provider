import {ArkaneSubProvider} from "./ArkaneSubProvider";

const ProviderEngine = require('web3-provider-engine');
const CacheSubprovider = require('web3-provider-engine/subproviders/cache');
const FixtureSubprovider = require('web3-provider-engine/subproviders/fixture');
const FilterSubprovider = require('web3-provider-engine/subproviders/filters');
// const VmSubprovider = require('web3-provider-engine/subproviders/vm');
const NonceSubprovider = require('web3-provider-engine/subproviders/nonce-tracker');
const RpcSubprovider = require('web3-provider-engine/subproviders/rpc');

if (typeof window !== 'undefined') {
    (window as any).ArkaneSubProvider = ArkaneSubProvider;

    (window as any).createArkaneProviderEngine = function (clientId: string) {
        const engine = new ProviderEngine();
        // engine.addProvider(new FixtureSubprovider({
        //     web3_clientVersion: 'ProviderEngine/v0.0.0/javascript',
        //     net_listening: true,
        //     eth_hashrate: '0x00',
        //     eth_mining: false,
        //     eth_syncing: true,
        // }));

        // // cache layer
        // engine.addProvider(new CacheSubprovider());
        //
        // // filters
        // engine.addProvider(new FilterSubprovider());
        // //
        // // // pending nonce
        // engine.addProvider(new NonceSubprovider());
        //
        // // vm
        // engine.addProvider(new VmSubprovider());
        //
        // engine.addProvider(new RpcSubprovider({
        //     rpcUrl: 'https://ethereum.arkane.network/',
        // }));

        const arkaneSubProvider = new ArkaneSubProvider(clientId);

        (window as any).arkaneConnect = arkaneSubProvider.arkaneConnect;

        return arkaneSubProvider.arkaneConnect.checkAuthenticated()
            .then(result => {
            result.authenticated(auth => {
                console.log("authenticated");
                console.log(auth);
            });
            result.notAuthenticated(noAuth => {
                console.log("not authenticated");
                console.log(noAuth);
            });
        }).then(_ => {
            engine.addProvider(arkaneSubProvider);
            engine.addProvider(new RpcSubprovider({rpcUrl: 'https://ethereum.arkane.network'}));

            // log new blocks

            // network connectivity error
            engine.on('error', function (err: any) {
                // report connectivity errors
                console.error(err.stack)
            });

            // start polling for blocks
            engine.start();
            return engine;
        });
    };
}