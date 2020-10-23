import { ArkaneConnect, AuthenticationOptions, AuthenticationResult } from "@arkane-network/arkane-connect/dist/src/connect/connect";
import { Network }                                                    from "@arkane-network/arkane-connect/dist/src/models/Network";
import { ArkaneSubProvider }                                          from "./ArkaneSubProvider";
import { Account }                                                    from '@arkane-network/arkane-connect/dist/src/models/Account';
import { NonceTrackerSubprovider }                                    from "./NonceTracker";
import { Provider }                                                   from 'ethereum-types';
import { SignedVersionedTypedDataSubProvider }                        from './SignedVersionedTypedDataSubProvider';

const ProviderEngine = require('@arkane-network/web3-provider-engine');
const CacheSubprovider = require('@arkane-network/web3-provider-engine/subproviders/cache');
const FixtureSubprovider = require('@arkane-network/web3-provider-engine/subproviders/fixture');
const FilterSubprovider = require('@arkane-network/web3-provider-engine/subproviders/filters');
const RpcSubprovider = require('@arkane-network/web3-provider-engine/subproviders/rpc');
const SubscriptionsSubprovider = require('@arkane-network/web3-provider-engine/subproviders/subscriptions');
const SanitizingSubprovider = require('@arkane-network/web3-provider-engine/subproviders/sanitizer');
const InflightCacheSubprovider = require('@arkane-network/web3-provider-engine/subproviders/inflight-cache');
const WebsocketSubprovider = require('@arkane-network/web3-provider-engine/subproviders/websocket');

export default class Arkane {

    private ac?: ArkaneConnect;
    private network?: Network;
    private originalNetwork?: Network;
    private rpcSubprovider: any;
    private nonceSubProvider: any;
    private signedVersionedTypedDataSubProvider: any;
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

    public async authenticate(authenticationOptions?: AuthenticationOptions): Promise<Account | {}> {
        if (!this.arkaneSubProvider) {
            throw new Error("Please initialise provider first (Arkane.createArkaneProviderEngine)");
        }
        return this.arkaneSubProvider.startGetAccountFlow(authenticationOptions);
    }

    public resetNetwork() {
        this.network = this.originalNetwork;
    }

    public createArkaneProviderEngine(options: ArkaneSubProviderOptions): Promise<Provider> {
        let endpoint = (options.rpcUrl || (options.network ? options.network.nodeUrl : undefined)) || this.getDefaultEndpoint(options);
        const engine = new ProviderEngine({pollingInterval: options.pollingInterval || 150000});
        engine.addProvider(new FixtureSubprovider({
            web3_clientVersion: 'ArkaneProviderEngine/v0.0.1/javascript',
            net_listening: true,
            eth_hashrate: '0x00',
            eth_mining: false,
            eth_syncing: true,
        }));

        this.nonceSubProvider = new NonceTrackerSubprovider({rpcUrl: endpoint});
        engine.addProvider(this.nonceSubProvider);

        engine.addProvider(new SanitizingSubprovider());

        engine.addProvider(new CacheSubprovider());


        engine.addProvider(new InflightCacheSubprovider());

        if(options.network && options.network.nodeUrl) {
            engine.addProvider(new SubscriptionsSubprovider());
            engine.addProvider(new FilterSubprovider());
        } else {
            let wsEndpoint = options.wsNodeUrl || this.getDefaultWssEndpoint(options);
            engine.addProvider(new WebsocketSubprovider({rpcUrl:wsEndpoint}));
        }

        this.arkaneSubProvider = new ArkaneSubProvider(options);
        this.ac = this.arkaneSubProvider.arkaneConnect;

        this.signedVersionedTypedDataSubProvider = new SignedVersionedTypedDataSubProvider(this.arkaneSubProvider);
        engine.addProvider(this.signedVersionedTypedDataSubProvider);

        this.rpcSubprovider = new RpcSubprovider({rpcUrl: endpoint});

        return options.skipAuthentication
            ? Promise.resolve(this.startEngine(engine))
            : this.arkaneSubProvider.getAccountsAsync().then(() => this.startEngine(engine));
    }

    private getDefaultEndpoint(options: ArkaneSubProviderOptions) {
        if (options.environment && (options.environment === 'qa' || options.environment === 'staging')) {
            return 'https://rinkeby.arkane.network';
        }
        return 'https://ethereum.arkane.network';
    }

    private getDefaultWssEndpoint(options: ArkaneSubProviderOptions) {
        if (options.environment && (options.environment === 'qa' || options.environment === 'staging')) {
            return 'wss://rinkeby-ws.arkane.network';
        }
        return 'wss://ethereum-ws.arkane.network';
    }

    private startEngine(engine: any) {
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
    pollingInterval?: number;
    wsNodeUrl?: string;
}

if (typeof window !== 'undefined') {
    (window as any).Arkane = new Arkane();
}
