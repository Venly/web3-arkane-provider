import { ArkaneConnect, AuthenticationOptions, AuthenticationResult } from "@arkane-network/arkane-connect/dist/src/connect/connect";
import { Network } from "@arkane-network/arkane-connect/dist/src/models/Network";
import { ArkaneWalletSubProvider } from "./ArkaneWalletSubProvider";
import { Account } from '@arkane-network/arkane-connect/dist/src/models/Account';
import { NonceTrackerSubprovider } from "./NonceTracker";
import { Provider } from 'ethereum-types';
import { SignedVersionedTypedDataSubProvider } from './SignedVersionedTypedDataSubProvider';
import { SecretType } from '@arkane-network/arkane-connect';

const ProviderEngine = require('@arkane-network/web3-provider-engine');
const CacheSubprovider = require('@arkane-network/web3-provider-engine/subproviders/cache');
const FixtureSubprovider = require('@arkane-network/web3-provider-engine/subproviders/fixture');
const FilterSubprovider = require('@arkane-network/web3-provider-engine/subproviders/filters');
const RpcSubprovider = require('@arkane-network/web3-provider-engine/subproviders/rpc');
const SubscriptionsSubprovider = require('@arkane-network/web3-provider-engine/subproviders/subscriptions');
const SanitizingSubprovider = require('@arkane-network/web3-provider-engine/subproviders/sanitizer');
const InflightCacheSubprovider = require('@arkane-network/web3-provider-engine/subproviders/inflight-cache');
const WebsocketSubprovider = require('@arkane-network/web3-provider-engine/subproviders/websocket');

class ArkaneSubProvider {

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
    let connectionDetails = this.getConnectionDetails(options);
    const engine = new ProviderEngine({ pollingInterval: options.pollingInterval || 150000 });
    engine.addProvider(new FixtureSubprovider({
      web3_clientVersion: 'ArkaneProviderEngine/v0.0.1/javascript',
      net_listening: true,
      eth_hashrate: '0x00',
      eth_mining: false,
      eth_syncing: true,
    }));

    this.nonceSubProvider = new NonceTrackerSubprovider({ rpcUrl: connectionDetails.endpointHttpUrl });
    engine.addProvider(this.nonceSubProvider);

    engine.addProvider(new SanitizingSubprovider());

    engine.addProvider(new CacheSubprovider());

    engine.addProvider(new InflightCacheSubprovider());

    if (!connectionDetails.endpointWsUrl) {
      engine.addProvider(new SubscriptionsSubprovider());
      engine.addProvider(new FilterSubprovider());
    } else {
      engine.addProvider(new WebsocketSubprovider({ rpcUrl: connectionDetails.endpointWsUrl }));
    }

    this.arkaneSubProvider = new ArkaneWalletSubProvider(options);
    this.ac = this.arkaneSubProvider.arkaneConnect;

    this.signedVersionedTypedDataSubProvider = new SignedVersionedTypedDataSubProvider(this.arkaneSubProvider);
    engine.addProvider(this.signedVersionedTypedDataSubProvider);

    this.rpcSubprovider = new RpcSubprovider({ rpcUrl: connectionDetails.endpointHttpUrl });

    return options.skipAuthentication
      ? Promise.resolve(this.startEngine(engine))
      : this.arkaneSubProvider.getAccountsAsync().then(() => this.startEngine(engine));
  }

  private getConnectionDetails(options: ArkaneSubProviderOptions): ConnectionDetails {
    if (options.network && options.network.nodeUrl) {
      return {
        endpointHttpUrl: options.network.nodeUrl
      }
    }
    let secretType = options.secretType ? options.secretType : SecretType.ETHEREUM;
    let endpoint = `${secretType.toLowerCase()}-node${options.environment && !options.environment.startsWith('prod') ? '-' + options.environment : ''}.arkane.network`;
    if (secretType == SecretType.ETHEREUM || secretType == SecretType.MATIC) {
      return {
        endpointHttpUrl: 'https://' + endpoint,
        endpointWsUrl: 'wss://ws-' + endpoint
      }
    }
    return {
      endpointHttpUrl: 'https://' + endpoint
    }
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

class ConnectionDetails {
  endpointHttpUrl: string;
  endpointWsUrl?: string;

  constructor(endpointHttpUrl: string, endpointWsUrl: string) {
    this.endpointHttpUrl = endpointHttpUrl;
    this.endpointWsUrl = endpointWsUrl;
  }
}

export interface ArkaneSubProviderOptions {
  clientId: string;
  environment?: string;
  /** Deprecated, use windowMode instead */
  signMethod?: string;
  windowMode?: string;
  bearerTokenProvider?: () => string;
  secretType?: SecretType;
  network?: Network;
  authenticationOptions?: AuthenticationOptions
  skipAuthentication: boolean;
  pollingInterval?: number;
}

if (typeof window !== 'undefined') {
  (window as any).Arkane = new ArkaneSubProvider();
}

export const Arkane = ArkaneSubProvider.prototype;
