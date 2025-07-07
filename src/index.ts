import { Account, AuthenticationOptions, AuthenticationResult, SecretType, WindowMode } from '@venly/connect';
import { VenlyController }                                                              from './venlyController';
import { CHAIN_CONFIGS, CHAIN_IDS }                                                     from './types';
import { JsonRpcEngine }                                                                from '@metamask/json-rpc-engine';
import { providerFromMiddleware }                                                       from '@metamask/eth-json-rpc-provider';
import providerFromEngine                                                               from './providerFromEngine';
import createVenlyMiddleware                                                            from './middleware/createVenlyMiddleware';
import createJsonRpcClient                                                              from './createJsonRpcClient';
import createFilterMiddleware                                                           from 'eth-json-rpc-filters';
import createSubscriptionManager                                                        from 'eth-json-rpc-filters/subscriptionManager';

export { SecretType, WindowMode } from '@venly/connect';
export { CHAIN_CONFIGS } from './types';

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
      ...chainId && { environment: CHAIN_CONFIGS[Number(chainId)].env }
    };
    this._provider.engine = this.#createEngine(options);
    this._provider.emit('chainChanged', chainId ?? CHAIN_IDS[secretType][this.venlyController.options.environment!]);
    this._provider.emit('accountsChanged', await this.venlyController.getAccounts());

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
    this._provider.emit('disconnect', { message: 'disconnect', code: 1000 });
  }

  #getRpcUrl(options: VenlyProviderOptions): string {
    let environment = options.environment!.replace('-local', 'qa');
    const chainId = parseInt(CHAIN_IDS[options.secretType!][environment]);
    return environment.startsWith('prod') ? `https://evm-node.venly.io/chains/${chainId}` : `https://evm-node-${environment}.venly.io/chains/${chainId}`;
  }

  #createEngine(options: VenlyProviderOptions) {
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
      getPendingNonce: this.venlyController.getPendingNonce.bind(this.venlyController),
      changeSecretType: this.changeSecretType.bind(this)
    });
    engine.push(venlyMiddleware);

    const rpcUrl = this.#getRpcUrl(options);
    const chainId = CHAIN_IDS[options.secretType!][options.environment!] ?? CHAIN_IDS[options.secretType!]['production'];
    if (!chainId)
      throw new Error(`Unable to determine chainId for secretType: ${options.secretType} and environment: ${options.environment}`);

    const { networkMiddleware, blockTracker } = createJsonRpcClient({ rpcUrl, chainId, venlyConnect: this.venlyController.venlyConnect });
    this._blockTracker = blockTracker;
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

    return engine;
  }

  public async createProvider(options: VenlyProviderOptions): Promise<any> {
    options.environment ??= 'production';
    if (options.environment === 'prod') options.environment = 'production';
    options.windowMode ??= WindowMode.POPUP;
    options.secretType ??= SecretType.ETHEREUM;
    options.skipAuthentication ??= false;
      
    const engine = this.#createEngine(options);
    const provider: any = providerFromEngine(engine);
    this._provider = provider;

    if (!options.skipAuthentication)
      await this.venlyController.getAccounts();
    return this._provider;
  }
  
}

/**
 * @type {Object}
 * @property {string} clientId - The clientId to connect to Venly
 * @property {string} environment - The environment to which you want to connect, possible values are 'sandbox' and 'production'. Defaults to 'production'.
 * @property {SecretType} secretType - The secret type to use. Allowed types for web3 provider: ETHEREUM, BSC, MATIC https://docs.venly.io/widget/widget-advanced/object-type-reference/secrettype
 * @property {WindowMode} windowMode - The sign method you want to use, possible values are POPUP or REDIRECT. Defaults to POPUP.
 * @property {function} bearerTokenProvider - You can implement all the authentication handling yourself and provide Venly Connect with your own bearer token provider. The bearer token provider is a function returning the bearer token (access token) to login to Venly. Default the Venly Connect authentication client is used.
 * @property {AuthenticationOptions} authenticationOptions - The options to use for authentications https://docs.venly.io/widget/widget-advanced/object-type-reference/authenticationoptions
 * @property {boolean} skipAuthentication - Boolean flag that indicates if you want to authenticate immediately or revert to checkAuthenticated(). Defaults to false.
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
