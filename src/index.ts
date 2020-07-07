import { ArkaneConnect, AuthenticationOptions, AuthenticationResult } from "@arkane-network/arkane-connect/dist/src/connect/connect";
import {Network}                                                      from "@arkane-network/arkane-connect/dist/src/models/Network";
import { ArkaneSubProvider } from "./ArkaneSubProvider";
import { SecretType }        from '@arkane-network/arkane-connect/dist/src/models/SecretType';
import { Account }           from '@arkane-network/arkane-connect/dist/src/models/Account';
import {NonceTrackerSubprovider} from "./NonceTracker";

const ProviderEngine = require('web3-provider-engine');
const CacheSubprovider = require('web3-provider-engine/subproviders/cache');
const FixtureSubprovider = require('web3-provider-engine/subproviders/fixture');
const FilterSubprovider = require('web3-provider-engine/subproviders/filters');
const RpcSubprovider = require('web3-provider-engine/subproviders/rpc');

export default class Arkane {

    private ac?: ArkaneConnect;
    private network?: Network;
    private originalNetwork?: Network;
    private rpcSubprovider: any;
    private nonceSubProvider: any;
    private arkaneSubProvider: any ;

    public arkaneConnect(network?: Network) {
        this.network = network;
        this.originalNetwork = network;
        return this.ac;
    }

    public changeNetwork(network: Network) {
        if (network && network.nodeUrl) {
            this.network = network;
            this.nonceSubProvider.rpcUrl = network.nodeUrl;
            this.rpcSubprovider.rpcUrl = network.nodeUrl;
            this.arkaneSubProvider.network = network;
        } else {
            console.warn("Not changing to network, not sufficient data: resetting network", network);
            this.resetNetwork();
        }
    }

    public resetNetwork() {
        this.network = this.originalNetwork;
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

        console.log("Arkane is using options", options);
        let endpoint = (options.rpcUrl || (options.network ? options.network.nodeUrl : undefined)) || 'https://ethereum.arkane.network';
        console.log('Arkane initialized with endpoint: ', endpoint);
        this.nonceSubProvider = new NonceTrackerSubprovider({rpcUrl: endpoint});
        engine.addProvider(this.nonceSubProvider);

        this.arkaneSubProvider = new ArkaneSubProvider(options);

        this.ac = this.arkaneSubProvider.arkaneConnect;

        this.rpcSubprovider = new RpcSubprovider({rpcUrl: endpoint});

        return this.arkaneSubProvider.arkaneConnect.flows.getAccount(SecretType.ETHEREUM, options.authenticationOptions)
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
                                    return this.arkaneSubProvider.loadData();
                                })
                                .then(() => {
                                    engine.addProvider(this.arkaneSubProvider);
                                    engine.addProvider(this.rpcSubprovider);

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
    /** @deprecated Use network instead. */
    rpcUrl?: string;
    environment?: string;
    /** Deprecated, use windowMode instead */
    signMethod?: string;
    windowMode?: string;
    bearerTokenProvider?: () => string;
    network?: Network;
    authenticationOptions?: AuthenticationOptions
}

if (typeof window !== 'undefined') {
    (window as any).Arkane = new Arkane();
}
