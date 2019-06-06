import { ArkaneSubProvider } from "./ArkaneSubProvider";
import { ArkaneConnect }     from "@arkane-network/arkane-connect/dist/src/connect/connect";
import { SecretType }        from '@arkane-network/arkane-connect/dist/src/models/SecretType';
import { Account }           from '@arkane-network/arkane-connect/dist/src/models/Account';

const ProviderEngine = require('web3-provider-engine');
const CacheSubprovider = require('web3-provider-engine/subproviders/cache');
const FixtureSubprovider = require('web3-provider-engine/subproviders/fixture');
const FilterSubprovider = require('web3-provider-engine/subproviders/filters');
const NonceSubprovider = require('web3-provider-engine/subproviders/nonce-tracker');
const RpcSubprovider = require('web3-provider-engine/subproviders/rpc');

export class Arkane {

    private ac?: ArkaneConnect;

    public arkaneConnect() {
        return this.ac;
    }

    public createArkaneProviderEngine(options: ArkaneSubProviderOptions) {
        const engine = new ProviderEngine();
        engine.addProvider(new FixtureSubprovider({
            web3_clientVersion: 'ArkaneProviderEngine/v0.0.1/javascript',
            net_listening: true,
            eth_hashrate: '0x00',
            eth_mining: false,
            eth_syncing: true,
        }));
        engine.addProvider(new CacheSubprovider());
        engine.addProvider(new FilterSubprovider());
        engine.addProvider(new NonceSubprovider());

        const arkaneSubProvider = new ArkaneSubProvider(options);

        this.ac = arkaneSubProvider.arkaneConnect;

        return arkaneSubProvider.arkaneConnect.flows.getAccount(SecretType.ETHEREUM)
                                .then(async (account: Account) => {
                                    return await new Promise((resolve, reject) => {
                                        if (!account.isAuthenticated) {
                                            console.debug('Not authenticated to Arkane Network');
                                            reject('not-authenticated');
                                        } else if (account.wallets && account.wallets.length <= 0) {
                                            console.debug('No wallet has been linked to this application');
                                            reject('no-wallet-linked');
                                        } else {
                                            console.debug("Authenticated to Arkane Network and at least one wallet is linked to this application");
                                            resolve();
                                        }
                                    });
                                })
                                .then(() => {
                                    return arkaneSubProvider.loadData();
                                })
                                .then(() => {
                                    engine.addProvider(arkaneSubProvider);
                                    engine.addProvider(new RpcSubprovider({rpcUrl: options.rpcUrl || 'https://ethereum.arkane.network'}));

                                    // network connectivity error
                                    engine.on('error', (err: any) => {
                                        // report connectivity errors
                                        console.error(err.stack)
                                    });

                                    // start polling for blocks
                                    engine.start();
                                    return engine;
                                });
    }
}

export interface ArkaneSubProviderOptions {
    clientId: string;
    rpcUrl?: string;
    environment?: string;
    /** Deprecated, use windowMode instead */
    signMethod?: string;
    windowMode?: string;
    bearerTokenProvider?: () => string;
}

if (typeof window !== 'undefined') {
    (window as any).Arkane = new Arkane();
}