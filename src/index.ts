import { SecretType, WindowMode, AuthenticationOptions, AuthenticationResult, Account } from '@venly/connect'
import { VenlyController } from './venlyController';
import { CHAIN_IDS, SECRET_TYPES } from './types';
import { JsonRpcEngine } from 'json-rpc-engine';
import { providerFromEngine, providerFromMiddleware } from '@metamask/eth-json-rpc-provider';
import createVenlyMiddleware from './middleware/createVenlyMiddleware';
import createJsonRpcClient from './createJsonRpcClient';
const createFilterMiddleware = require('eth-json-rpc-filters');
const createSubscriptionManager = require('eth-json-rpc-filters/subscriptionManager');

export { SecretType, WindowMode } from '@venly/connect';
export { SECRET_TYPES } from './types';

export class VenlyProvider {

  venlyController!: VenlyController;
  _provider: any;
  _blockTracker: any;

  public get connect() {
    return this.venlyController?.venlyConnect;
  }

  public async changeSecretType(secretType: SecretType = SecretType.ETHEREUM, chainId?: string): Promise<any> {
    if (!this._provider)
      throw new Error('Please initialise provider first (Venly.createProvider)');
      
    const options = {...this.venlyController.options,
      secretType: secretType,
      ...chainId && { environment: SECRET_TYPES[Number(chainId)].env }
    };
    this._provider.emit('chainChanged', chainId);
    this._provider = await this.createProvider(options);
    return this._provider;
  }

  public async checkAuthenticated(): Promise<AuthenticationResult> {
    if (!this._provider)
      throw new Error('Please initialise provider first (Venly.createProvider)');

    return this.venlyController.checkAuthenticated();
  }

  public async authenticate(authenticationOptions?: AuthenticationOptions): Promise<Account | {}> {
    if (!this._provider)
      throw new Error('Please initialise provider first (Venly.createProvider)');

    return this.venlyController.authenticate(authenticationOptions);
  }

  public async logout() {
    if (!this._provider)
      throw new Error('Please initialise provider first (Venly.createProvider)');

    await this.venlyController.logout();
  }

  public async createProvider(options: VenlyProviderOptions): Promise<any> {
    options.environment ??= 'production';
    options.windowMode ??= WindowMode.POPUP;
    options.secretType ??= SecretType.ETHEREUM;
    options.skipAuthentication ??= false;

    if (!this.venlyController || this.venlyController.options.environment != options.environment)
      this.venlyController = new VenlyController(options);
    else {
      this.venlyController.options = options;
      this.venlyController.resetWallets();
    }
      
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
      changeSecretType: this.changeSecretType.bind(this)
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
        provider.send(req, (err: any, res: any) => {
          if (err) reject(res.error);
          else resolve(res.result)
        });
      });
    }
    this._provider = provider;
    this._provider.emit('connect', { chainId });
    this._blockTracker = blockTracker;
    if (!options.skipAuthentication)
      await this.venlyController.getAccounts();
    return this._provider;
  }

  private getRpcUrl(options: VenlyProviderOptions): string {
    const secretType = options.secretType!.toLowerCase();
    let environment = options.environment!.replace('-local', '');
    return environment.startsWith('prod') ? `https://${secretType}-node.venly.io` : `https://${secretType}-node-${environment}.venly.io`;
  }
  
}

/**
 * @type {Object}
 * @property {string} clientId - The clientId to connect to Venly
 * @property {string} environment - The environment to which you want to connect, possible values are 'staging' and 'prod'. Default set to 'prod'.
 * @property {SecretType} secretType - The secret type to use. Allowed types for web3 provider: ETHEREUM, BSC, MATIC https://docs.venly.io/widget/widget-advanced/object-type-reference/secrettype
 * @property {WindowMode} windowMode - The sign method you want to use, possible values are POPUP or REDIRECT. Default set to POPUP.
 * @property {function} bearerTokenProvider - You can implement all the authentication handling yourself and provide Venly Connect with your own bearer token provider. The bearer token provider is a function returning the bearer token (access token) to login to Venly. Default the Venly Connect authentication client is used.
 * @property {AuthenticationOptions} authenticationOptions - The options to use for authentications https://docs.venly.io/widget/widget-advanced/object-type-reference/authenticationoptions
 * @property {boolean} skipAuthentication - Boolean flag that indicates if you want to authenticate immediately or revert to checkAuthenticated(). Default set to false.
 */
export interface VenlyProviderOptions {
  clientId: string;
  environment?: string;
  secretType?: SecretType;
  windowMode?: WindowMode;
  bearerTokenProvider?: () => string;
  authenticationOptions?: AuthenticationOptions
  skipAuthentication?: boolean;
  pollingInterval?: number;
}

(globalThis as any).Venly = new VenlyProvider();