import { SecretType, WindowMode, AuthenticationOptions, AuthenticationResult, Account } from '@venly/connect'
import { VenlyController } from './venlyController';
import { CHAIN_IDS, SECRET_TYPES } from './types';
import { JsonRpcEngine } from 'json-rpc-engine';
import { providerFromEngine, providerFromMiddleware } from '@metamask/eth-json-rpc-provider';
import createVenlyMiddleware from './middleware/createVenlyMiddleware';
// import createLoggerMiddleware from './createLoggerMiddleware';
// import createOriginMiddleware from './createOriginMiddleware';
import createJsonRpcClient from './createJsonRpcClient';
const createFilterMiddleware = require('eth-json-rpc-filters');
const createSubscriptionManager = require('eth-json-rpc-filters/subscriptionManager');

export { SecretType } from '@venly/connect';
export { SECRET_TYPES } from './types';

export class VenlyProvider {

  venlyController: VenlyController = new VenlyController();
  _provider: any;
  _blockTracker: any;

  public connect() {
    return this.venlyController?.venlyConnect;
  }

  public async changeSecretType(secretType: SecretType = SecretType.ETHEREUM, chainId?: string): Promise<any> {
    if (!this._provider)
      throw new Error('Please initialise provider first (Venly.createProviderEngine)');
      
    this.venlyController.lastWalletsFetch = undefined;
    const options = {...this.venlyController.options,
      secretType: secretType,
      ...chainId && { environment: SECRET_TYPES[Number(chainId)].env }
    };
    this._provider.emit('chainChanged', chainId);
    this._provider = await this.createProviderEngine(options);
    return this._provider;
  }

  public async checkAuthenticated(): Promise<AuthenticationResult> {
    if (!this._provider)
      throw new Error('Please initialise provider first (Venly.createProviderEngine)');

    return this.venlyController.venlyConnect.checkAuthenticated();
  }

  public async authenticate(authenticationOptions?: AuthenticationOptions): Promise<Account | {}> {
    if (!this._provider)
      throw new Error('Please initialise provider first (Venly.createProviderEngine)');

    return this.venlyController.startGetAccountFlow(authenticationOptions);
  }

  public createProviderEngine(options: VenlyProviderOptions): Promise<any> {
    options.environment = options.environment || 'production';
    options.windowMode = options.windowMode || WindowMode.REDIRECT;
    options.secretType = options.secretType || SecretType.ETHEREUM;

    this.venlyController.initialize(options);
    const engine = new JsonRpcEngine();

    const venlyMiddleware = createVenlyMiddleware({
      getAccounts: this.venlyController.getAccounts.bind(this.venlyController),
      processTransaction: this.venlyController.processTransaction.bind(this.venlyController),
      processSignTransaction: this.venlyController.processSignTransaction.bind(this.venlyController),
      processEthSignMessage: this.venlyController.processEthSignMessage.bind(this.venlyController),
      processTypedMessage: this.venlyController.processTypedMessage.bind(this.venlyController),
      processTypedMessageV3: this.venlyController.processTypedMessage.bind(this.venlyController),
      processTypedMessageV4: this.venlyController.processTypedMessage.bind(this.venlyController),
      processPersonalMessage: this.venlyController.processPersonalMessage.bind(this.venlyController),
      getTransactionByHash: this.venlyController.getTransactionByHash.bind(this.venlyController),
      getPendingTransactions: this.venlyController.getPendingTransactions.bind(this.venlyController),
      changeSecretType: this.changeSecretType.bind(this),
      // getPendingNonce: this.venlyController.getPendingNonce.bind(this.venlyController),
      // getPendingTransactionByHash: (hash: any) => { }
      // this.txController.getTransactions({
      //   searchCriteria: {
      //     hash,
      //     status: TRANSACTION_STATUSES.SUBMITTED,
      //   },
      // })[0],
    });
    engine.push(venlyMiddleware);

    const rpcUrl = this.getRpcUrl(options);
    const chainId = CHAIN_IDS[options.secretType][options.environment];
    const { networkMiddleware, blockTracker } = createJsonRpcClient({ rpcUrl, chainId });
    const networkProvider = providerFromMiddleware(networkMiddleware);
    const filterMiddleware = createFilterMiddleware({
      provider: networkProvider,
      blockTracker,
    });
    const subscriptionManager = createSubscriptionManager({
      provider: networkProvider,
      blockTracker,
    });
    subscriptionManager.events.on('notification', (message: any) =>
      engine.emit('notification', message),
    );
    engine.push(filterMiddleware);
    engine.push(subscriptionManager.middleware);
    engine.push(networkMiddleware);

    const provider: any = providerFromEngine(engine);
    provider.request = function(req: any) {
      return new Promise((resolve, reject) => {
        this.send(req, (err: any, res: any) => {
          if (err) reject(res.error);
          else resolve(res.result)
        });
      });
    }
    this._provider = provider;
    this._provider.emit('connect', { chainId });
    this._blockTracker = blockTracker;
    return Promise.resolve(this._provider);
  }

  private getRpcUrl(options: VenlyProviderOptions): string {
    const secretType = options.secretType!.toLowerCase();
    let environment = options.environment!.replace('-local', '');
    return environment.startsWith('prod') ? `https://${secretType}-node.arkane.network` : `https://${secretType}-node-${environment}.arkane.network`;
  }
  
}

export interface VenlyProviderOptions {
  clientId: string;
  environment?: string;
  secretType?: SecretType;
  windowMode?: WindowMode;
  bearerTokenProvider?: () => string;
  authenticationOptions?: AuthenticationOptions
  skipAuthentication: boolean;
  pollingInterval?: number;
}

(globalThis as any).Venly = new VenlyProvider();