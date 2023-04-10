import { VenlyConnect, Wallet, AuthenticationOptions, Account } from '@venly/connect'
import { VenlyProviderOptions } from './index';
import { REQUEST_TYPES } from './types';
import { hexToUtf8 } from './util';

export class VenlyController {

  venlyConnect!: VenlyConnect;
  options!: VenlyProviderOptions;
  lastWalletsFetch?: number;
  wallets: Wallet[] = [];
  
  initialize(options: VenlyProviderOptions) {
    this.options = options;
    this.venlyConnect = new VenlyConnect(options.clientId, {
      environment: options.environment,
      windowMode: options.windowMode,
      bearerTokenProvider: options.bearerTokenProvider,
      useOverlayWithPopup: false
    });
  }

  async authenticate() {
    let authResult = await this.venlyConnect.checkAuthenticated();
    if (!authResult.isAuthenticated)
      authResult = await this.venlyConnect.flows.authenticate({
        windowMode: this.options.authenticationOptions?.windowMode,
        forcePopup: true,
        closePopup: this.options.authenticationOptions?.closePopup
      });
    return authResult;
  }

  async getAccounts(): Promise<string[]> {
    let promise: Promise<any> = Promise.resolve();

    const authResult = await this.venlyConnect.checkAuthenticated();
    if (!authResult.isAuthenticated)
      promise = this.startGetAccountFlow();
    else
      promise = this.refreshWallets();

    return promise.then(() => {
      return this.wallets.map((wallet) => wallet.address)
    });
  }

  async processTransaction(params: any, req: any) {
    const signer = this.venlyConnect.createSigner();
    const transactionData = {
      walletId: this.getWalletIdFrom(params.from),
      type: REQUEST_TYPES[this.options.secretType!].transaction,
      ...params.to && { to: params.to },
      ...params.data && { data: params.data },
      ...params.value && { value: BigInt(params.value).toString() },
      ...params.gas && { gas: BigInt(params.gas).toString() },
      ...params.gasPrice && { gasPrice: BigInt(params.gasPrice).toString() },
      ...params.nonce && { nonce: BigInt(params.nonce).toString() }
    };
    const res = await signer.executeNativeTransaction(transactionData);
    if (res.status === 'SUCCESS')
      return res.result.transactionHash;
    else
      throw new Error(res.errors?.join(', '));
  }

  async processSignTransaction(params: any, req: any): Promise<string> {
    const signer = this.venlyConnect.createSigner();
    const transactionData = {
      walletId: this.getWalletIdFrom(params.from),
      type: REQUEST_TYPES[this.options.secretType!].signature,
      ...params.to && { to: params.to },
      ...params.data && { data: params.data },
      ...params.value && { value: BigInt(params.value).toString() },
      ...params.gas && { gas: BigInt(params.gas).toString() },
      ...params.gasPrice && { gasPrice: BigInt(params.gasPrice).toString() },
      ...params.nonce && { nonce: BigInt(params.nonce).toString() }
    };
    const res = await signer.sign(transactionData);
    if (res.status === 'SUCCESS')
      return res.result.signedTransaction;
    else
      throw new Error(res.errors?.join(', '));
  }

  async processEthSignMessage(params: any, req: any) {
    const signer = this.venlyConnect.createSigner();
    const res = await signer.signMessage({
      walletId: this.getWalletIdFrom(params.from),
      secretType: this.options.secretType!,
      data: params.data
    });
    if (res.status === 'SUCCESS')
      return res.result.signature;
    else
      throw new Error(res.errors?.join(', '));
  }

  async processTypedMessage(params: any, req: any, version: any): Promise<string> {
    const signer = this.venlyConnect.createSigner();
    const res = await signer.signEip712({
      walletId: this.getWalletIdFrom(params.from),
      secretType: this.options.secretType!,
      data: JSON.parse(params.data)
    });
    if (res.status === 'SUCCESS')
        return res.result.signature;
    else
      throw new Error(res.errors?.join(', '));
  }

  async processPersonalMessage(params: any, req: any) {
    let message = params.data;
    try {
      message = hexToUtf8(params.data);
    }
    catch {}
    const signer = this.venlyConnect.createSigner();
    const res = await signer.signMessage({
      walletId: this.getWalletIdFrom(params.from),
      secretType: this.options.secretType!,
      data: message
    });
    if (res.status === 'SUCCESS')
      return res.result.signature;
    else
      throw new Error(res.errors?.join(', '));
  }

  async getTransactionByHash(hash: string) {
    const res: any = await this.venlyConnect.api.getTransactionStatus(hash, this.options.secretType!);
    res.value = BigInt(res.rawValue).toString();
    if (!res.data) res.data = '0x';
    const {rawValue, ...transaction} = res;
    return transaction;
  }

  async getPendingTransactions() {
    const res: any = await this.venlyConnect.api.getPendingTransactions();
    return res.map((tx: any) => {
      const {rawValue, type, ...transaction} = tx.transactionRequest;
      transaction.value = BigInt(transaction.value).toString();
      return transaction;
    });
  }

  private async refreshWallets() {
    if (!this.lastWalletsFetch || (Date.now() - this.lastWalletsFetch) > 5000) {
      let wallets = await this.venlyConnect.api.getWallets({ secretType: this.options.secretType, includeBalance: false });
      if (!wallets || wallets.length < 1) {
        let account = await this.venlyConnect.flows.getAccount(this.options.secretType!, this.options.authenticationOptions);
        wallets = account.wallets;
      }
      this.wallets = wallets;
    }
    this.lastWalletsFetch = Date.now();
    return this.wallets;
  }

  public async startGetAccountFlow(authenticationOptions?: AuthenticationOptions): Promise<Account | {}> {
    if (authenticationOptions) {
      this.options.authenticationOptions = authenticationOptions;
    }
    return this.venlyConnect.flows.getAccount(this.options.secretType!, this.options.authenticationOptions)
      .then(async (account: Account) => {
        return await new Promise((resolve, reject) => {
          if (!account.isAuthenticated)
            reject('not-authenticated');
          else if (account.wallets && account.wallets.length <= 0)
            reject('no-wallet-linked');
          else {
            this.wallets = account.wallets;
            this.lastWalletsFetch = Date.now();
            resolve(account);
          }
        });
      });
  }

  private getWalletIdFrom(address: string): string {
    let foundWallet = this.wallets.find((wallet) => {
      return wallet.address?.toLowerCase() === address?.toLowerCase();
    });
    return (foundWallet?.id) || '';
  }

}