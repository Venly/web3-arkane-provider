import { ArkaneConnect, AuthenticationOptions, AuthenticationResult } from "@arkane-network/arkane-connect/dist/src/connect/connect";
import { ArkaneWalletSubProvider } from "./ArkaneWalletSubProvider";
import { Account } from '@arkane-network/arkane-connect/dist/src/models/Account';
import { NonceTrackerSubprovider } from "./NonceTracker";
import { Provider } from 'ethereum-types';
import { SignedVersionedTypedDataSubProvider } from './SignedVersionedTypedDataSubProvider';
import { SecretType } from '@arkane-network/arkane-connect';
import { SignTransactionGasFix } from './SignTransactionGasFix';

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
  private rpcSubprovider: any;
  private nonceSubProvider: any;
  private signedVersionedTypedDataSubProvider: any;
  private arkaneSubProvider?: ArkaneWalletSubProvider;
  private engine?: any;

  public arkaneConnect() {
    return this.ac;
  }

  public async changeSecretType(secretType: SecretType = SecretType.ETHEREUM): Promise<Provider | undefined> {
    if (this.arkaneSubProvider && this.arkaneSubProvider.options) {
      this.arkaneSubProvider.options.secretType = secretType;
      this.arkaneSubProvider.lastWalletsFetch = undefined;
      this.engine.stop();
      return this.createArkaneProviderEngine(this.arkaneSubProvider.options);
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

  public createArkaneProviderEngine(options: ArkaneSubProviderOptions): Promise<Provider> {
    let connectionDetails = this.getConnectionDetails(options);
    this.engine = new ProviderEngine({ pollingInterval: options.pollingInterval || 15000 });
    this.engine.addProvider(new FixtureSubprovider({
      web3_clientVersion: 'ArkaneProviderEngine/v0.21.0/javascript',
      net_listening: true,
      eth_hashrate: '0x00',
      eth_mining: false,
      eth_syncing: true,
    }));

    this.engine.addProvider(new SignTransactionGasFix());

    if (!this.arkaneSubProvider) {
      this.arkaneSubProvider = new ArkaneWalletSubProvider(options);
    }
    this.ac = this.arkaneSubProvider.arkaneConnect;

    if(!this.signedVersionedTypedDataSubProvider) {
      this.signedVersionedTypedDataSubProvider = new SignedVersionedTypedDataSubProvider(this.arkaneSubProvider);
    }
    this.engine.addProvider(this.signedVersionedTypedDataSubProvider);


    this.engine.addProvider(new FilterSubprovider());

    this.nonceSubProvider = new NonceTrackerSubprovider({ rpcUrl: connectionDetails.endpointHttpUrl });
    this.engine.addProvider(this.nonceSubProvider);



    this.engine.addProvider(new SanitizingSubprovider());

    this.engine.addProvider(new SubscriptionsSubprovider());

    this.engine.addProvider(new CacheSubprovider());

    this.engine.addProvider(new InflightCacheSubprovider());



    this.rpcSubprovider = new RpcSubprovider({ rpcUrl: connectionDetails.endpointHttpUrl });
    this.engine.addProvider(this.arkaneSubProvider);
    this.engine.addProvider(this.rpcSubprovider);

    return options.skipAuthentication
      ? Promise.resolve(this.startEngine(this.engine))
      : this.arkaneSubProvider.getAccountsAsync().then(() => this.startEngine(this.engine));
  }

  private getConnectionDetails(options: ArkaneSubProviderOptions): ConnectionDetails {
    let secretType = options.secretType ? options.secretType : SecretType.ETHEREUM;
    let environment = options.environment;
    environment = environment?.replace('-local', '');
    let endpoint = `${secretType.toLowerCase()}-node${environment && !environment.startsWith('prod') ? '-' + environment : ''}.arkane.network`;
    return {
      endpointHttpUrl: 'https://' + endpoint
    }
  }

  private startEngine(engine: any) {
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
  authenticationOptions?: AuthenticationOptions
  skipAuthentication: boolean;
  pollingInterval?: number;
}

if (typeof window !== 'undefined') {
  (window as any).Arkane = new ArkaneSubProvider();
}

export const Arkane = ArkaneSubProvider.prototype;
