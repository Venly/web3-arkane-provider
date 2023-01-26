import { AuthenticationOptions, AuthenticationResult } from '@venly/connect/dist/src/connect/connect';
import { Account } from '@venly/connect/dist/src/models/Account';
import { SecretType, VenlyConnect } from '@venly/connect';
import { Provider } from 'ethereum-types';
import { VenlyWalletSubProvider } from './VenlyWalletSubProvider';
import { NonceTrackerSubprovider } from './NonceTracker';
import { SignedVersionedTypedDataSubProvider } from './SignedVersionedTypedDataSubProvider';
import { RequestAccountsSubProvider } from './RequestAccountsSubProvider';
import { SignTransactionGasFix } from './SignTransactionGasFix';

const ProviderEngine = require('@arkane-network/web3-provider-engine');
const FixtureSubprovider = require('@arkane-network/web3-provider-engine/subproviders/fixture');
const CacheSubprovider = require('@arkane-network/web3-provider-engine/subproviders/cache');
const FilterSubprovider = require('@arkane-network/web3-provider-engine/subproviders/filters');
const SanitizerSubprovider = require('@arkane-network/web3-provider-engine/subproviders/sanitizer');
const SubscriptionsSubprovider = require('@arkane-network/web3-provider-engine/subproviders/subscriptions');
const InflightCacheSubprovider = require('@arkane-network/web3-provider-engine/subproviders/inflight-cache');
const RpcSubprovider = require('@arkane-network/web3-provider-engine/subproviders/rpc');
const WebsocketSubprovider = require('@arkane-network/web3-provider-engine/subproviders/websocket');

export class VenlySubProvider {

  private venlyConnect?: VenlyConnect;
  private signedVersionedTypedDataSubProvider: any;
  private requestAccountsSubProvider: any;
  private subProvider?: VenlyWalletSubProvider;
  private engine?: any;

  public connect() {
    return this.venlyConnect;
  }

  public async changeSecretType(secretType: SecretType = SecretType.ETHEREUM): Promise<Provider | undefined> {
    if (this.subProvider && this.subProvider.options) {
      this.subProvider.options.secretType = secretType;
      this.subProvider.lastWalletsFetch = undefined;
      this.engine.stop();
      return this.createProviderEngine(this.subProvider.options);
    }
  }

  public hasSubProvider(): boolean {
    return !!this.subProvider;
  }

  public async checkAuthenticated(): Promise<AuthenticationResult> {
    if (!this.subProvider) {
      throw new Error('Please initialise provider first (Venly.createProviderEngine)');
    }
    return this.subProvider.checkAuthenticated();
  }

  public async authenticate(authenticationOptions?: AuthenticationOptions): Promise<Account | {}> {
    if (!this.subProvider) {
      throw new Error('Please initialise provider first (Venly.createProviderEngine)');
    }
    return this.subProvider.startGetAccountFlow(authenticationOptions);
  }

  public createProviderEngine(options: VenlySubProviderOptions): Promise<Provider> {
    let connectionDetails = this.getConnectionDetails(options);
    this.engine = new ProviderEngine({pollingInterval: options.pollingInterval || 15000});
    this.engine.addProvider(new FixtureSubprovider({
      web3_clientVersion: 'VenlyProviderEngine/v0.21.0/javascript',
      net_listening: true,
      eth_hashrate: '0x00',
      eth_mining: false,
      eth_syncing: true,
    }));

    if (!this.subProvider) this.subProvider = new VenlyWalletSubProvider(options);
    this.engine.addProvider(this.subProvider);
    this.venlyConnect = this.subProvider.connect;

    if (!this.signedVersionedTypedDataSubProvider) this.signedVersionedTypedDataSubProvider = new SignedVersionedTypedDataSubProvider(this.subProvider);
    this.engine.addProvider(this.signedVersionedTypedDataSubProvider);
    if (!this.requestAccountsSubProvider) this.requestAccountsSubProvider = new RequestAccountsSubProvider(this.subProvider);
    this.engine.addProvider(this.requestAccountsSubProvider);

    this.engine.addProvider(new NonceTrackerSubprovider({rpcUrl: connectionDetails.endpointHttpUrl}));
    this.engine.addProvider(new SignTransactionGasFix());
    
    this.engine.addProvider(new CacheSubprovider());
    this.engine.addProvider(new FilterSubprovider());
    this.engine.addProvider(new SanitizerSubprovider());
    this.engine.addProvider(new SubscriptionsSubprovider());
    this.engine.addProvider(new InflightCacheSubprovider());
    this.engine.addProvider(new RpcSubprovider({rpcUrl: connectionDetails.endpointHttpUrl}));

    return options.skipAuthentication
      ? Promise.resolve(this.startEngine(this.engine))
      : this.subProvider.getAccountsAsync().then(() => this.startEngine(this.engine));
  }

  private getConnectionDetails(options: VenlySubProviderOptions): ConnectionDetails {
    let secretType = options.secretType ? options.secretType : SecretType.ETHEREUM;
    let environment = options.environment;
    environment = environment?.replace('-local', '');
    let endpoint = `${secretType.toLowerCase()}-node${environment && !environment.startsWith('prod') ? '-' + environment : ''}.arkane.network`;
    return {
      endpointHttpUrl: 'https://' + endpoint
    }
  }

  private startEngine(engine: any) {
    engine.on('error', (err: any) => {
      console.error(err.stack)
    });
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

export interface VenlySubProviderOptions {
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
  (window as any).Venly = new VenlySubProvider();
}