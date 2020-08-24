import { ArkaneConnect, AuthenticationOptions, AuthenticationResult } from "@arkane-network/arkane-connect/dist/src/connect/connect";
import { Network }                                                    from "@arkane-network/arkane-connect/dist/src/models/Network";
import { ArkaneSubProvider }                                          from "./ArkaneSubProvider";
import { SecretType }                                                 from '@arkane-network/arkane-connect/dist/src/models/SecretType';
import { Account }                                                    from '@arkane-network/arkane-connect/dist/src/models/Account';
import { NonceTrackerSubprovider }                                    from "./NonceTracker";
import { Provider }                                                   from 'ethereum-types';

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
    private arkaneSubProvider: any;

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

    public async checkAuthenticated(): Promise<AuthenticationResult> {
        if (!this.arkaneSubProvider) {
            throw new Error("Please initialise provider first (Arkane.createArkaneProviderEngine)");
        }
        return this.arkaneSubProvider.checkAuthenticated();
    }

    public async authenticate(): Promise<Account | {}> {
        if (!this.arkaneSubProvider) {
            throw new Error("Please initialise provider first (Arkane.createArkaneProviderEngine)");
        }
        return this.arkaneSubProvider.startGetAccountFlow();
    }

    public resetNetwork() {
        this.network = this.originalNetwork;
    }

    public createArkaneProviderEngine(options: ArkaneSubProviderOptions): Promise<Provider> {
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

        return options.skipAuthentication
            ? Promise.resolve(this.startEngine(engine))
            : this.arkaneSubProvider.getAccountsAsync().then(() => this.startEngine(engine));
    }

    private startEngine(engine: any) {
        console.log('setting engine');
        engine.addProvider(this.arkaneSubProvider);
        engine.addProvider(this.rpcSubprovider);

        // network connectivity error
        engine.on('error', (err: any) => {
            // report connectivity errors
            console.error(err.stack)
        });

        // start polling for blocks
        engine.start();
        console.log('returning engine', engine);
        return engine;
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
    skipAuthentication: boolean;
}

if (typeof window !== 'undefined') {
    (window as any).Arkane = new Arkane();
}
