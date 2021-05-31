import { ArkaneConnect, SecretType, SignatureRequestType, SignMethod, Wallet, WindowMode } from "@arkane-network/arkane-connect"
import { PartialTxParams } from "@0x/subproviders";
import { BaseWalletSubprovider } from "@0x/subproviders/lib/src/subproviders/base_wallet_subprovider";
import { ArkaneSubProviderOptions } from "./index";
import { AuthenticationOptions, AuthenticationResult, ConstructorOptions } from '@arkane-network/arkane-connect/dist/src/connect/connect';
import { Account } from '@arkane-network/arkane-connect/dist/src/models/Account';
import { BuildEip712SignRequestDto } from '@arkane-network/arkane-connect/dist/src/models/transaction/build/BuildEip712SignRequestDto';

export class ArkaneWalletSubProvider extends BaseWalletSubprovider {

  readonly arkaneConnect: ArkaneConnect;
  private wallets: Wallet[] = [];
  public options: ArkaneSubProviderOptions;
  private authenticated: boolean = false;
  public lastWalletsFetch?: number;

  constructor(options: ArkaneSubProviderOptions) {
    super();
    const connectConstructorOptions: ConstructorOptions = {
      environment: options.environment || 'production',
      bearerTokenProvider: options.bearerTokenProvider,
    };
    if (options.signMethod) {
      Object.assign(connectConstructorOptions, { signUsing: options.signMethod == 'POPUP' ? SignMethod.POPUP : SignMethod.REDIRECT });
    }
    if (options.windowMode) {
      Object.assign(connectConstructorOptions, { windowMode: options.windowMode == 'POPUP' ? WindowMode.POPUP : WindowMode.REDIRECT });
    }
    this.arkaneConnect = new ArkaneConnect(options.clientId, connectConstructorOptions);
    this.options = options;
  }

  public async startGetAccountFlow(authenticationOptions?: AuthenticationOptions): Promise<Account | {}> {
    if (authenticationOptions) {
      this.options.authenticationOptions = authenticationOptions;
    }
    let that = this;
    return this.arkaneConnect.flows.getAccount(this.options.secretType || SecretType.ETHEREUM, this.options.authenticationOptions)
      .then(async (account: Account) => {
        return await new Promise((resolve,
                                  reject) => {
          if (!account.isAuthenticated) {
            reject('not-authenticated');
          } else if (account.wallets && account.wallets.length <= 0) {
            reject('no-wallet-linked');
          } else {
            that.authenticated = true;
            that.wallets = account.wallets;
            that.lastWalletsFetch = Date.now();
            resolve(account);
          }
        });
      });
  }

  public async refreshWallets() {
    let newWallets = await this.arkaneConnect.api.getWallets({ secretType: this.options.secretType || SecretType.ETHEREUM, includeBalance: false });
    if (!newWallets || newWallets.length < 1) {
      let account = await this.arkaneConnect.flows.getAccount(this.options.secretType || SecretType.ETHEREUM, this.options.authenticationOptions);
      newWallets = account.wallets;
    }
    this.wallets = newWallets;
    return newWallets;
  }

  /**
   * Retrieve the accounts associated with the eth-lightwallet instance.
   * This method is implicitly called when issuing a `eth_accounts` JSON RPC request
   * via your providerEngine instance.
   *
   * @return An array of accounts
   */
  public async getAccountsAsync(): Promise<string[]> {
    let that = this;
    let promise: Promise<any>;
    if (!this.authenticated) {
      promise = this.startGetAccountFlow();
    } else if (this.shouldRefreshWallets()) {
      this.lastWalletsFetch = Date.now();
      promise = this.refreshWallets();
    } else {
      promise = Promise.resolve();
    }
    return promise.then(() => {
      return this.wallets.map((wallet) => wallet.address)
    });
  }

  private shouldRefreshWallets(): boolean {
    return !this.lastWalletsFetch
      || (Date.now() - this.lastWalletsFetch) > 5000;
  }

  public async checkAuthenticated(): Promise<AuthenticationResult> {
    return this.arkaneConnect.checkAuthenticated().then(authResult => {
      this.authenticated = authResult.isAuthenticated;
      return authResult;
    });
  }

  /**
   * Signs a transaction with the account specificed by the `from` field in txParams.
   * If you've added this Subprovider to your app's provider, you can simply send
   * an `eth_sendTransaction` JSON RPC request, and this method will be called auto-magically.
   * If you are not using this via a ProviderEngine instance, you can call it directly.
   * @param txParams Parameters of the transaction to sign
   * @return Signed transaction hex string
   */
  public async signTransactionAsync(txParams: PartialTxParams): Promise<string> {
    let signer = this.arkaneConnect.createSigner();
    return signer.signTransaction(this.constructEthereumTransationSignatureRequest(txParams))
      .then((result) => {
        if (result.status === 'SUCCESS') {
          return result.result.signedTransaction;
        } else {
          throw new Error((result.errors && result.errors.join(", ")));
        }
      });
  }

  private constructEthereumTransationSignatureRequest(txParams: PartialTxParams) {
    let type = SignatureRequestType.ETHEREUM_TRANSACTION;
    if (this.options.secretType && this.options.secretType == SecretType.ETHEREUM) {
      type = SignatureRequestType.ETHEREUM_TRANSACTION;
    } else if (this.options.secretType && this.options.secretType == SecretType.MATIC) {
      type = SignatureRequestType.MATIC_TRANSACTION;
    } else if (this.options.secretType && this.options.secretType == SecretType.BSC) {
      type = SignatureRequestType.BSC_TRANSACTION;
    } else if (this.options.secretType && this.options.secretType == SecretType.AVAC) {
      type = SignatureRequestType.AVAC_TRANSACTION;
    }
    const retVal = {
      gasPrice: txParams.gasPrice ? BigInt(txParams.gasPrice).toString(10) : txParams.gasPrice,
      gas: txParams.gas ? BigInt(txParams.gas).toString(10) : txParams.gas,
      to: txParams.to,
      nonce: txParams.nonce ? BigInt(txParams.nonce).toString(10) : txParams.nonce,
      data: (txParams.data) || '0x',
      value: txParams.value ? BigInt(txParams.value).toString(10) : "0",
      submit: false,
      type: type,
      walletId: this.getWalletIdFrom(txParams.from),
    };
    return retVal;
  }

  /**
   * Sign a personal Ethereum signed message. The signing account will be the account
   * associated with the provided address.
   * If you've added this Subprovider to your app's provider, you can simply send an `eth_sign`
   * or `personal_sign` JSON RPC request, and this method will be called auto-magically.
   * If you are not using this via a ProviderEngine instance, you can call it directly.
   * @param data Hex string message to sign
   * @param address Address of the account to sign with
   * @return Signature hex string (order: rsv)
   */
  public async signPersonalMessageAsync(data: string,
                                        address: string): Promise<string> {
    const signer = this.arkaneConnect.createSigner();
    let type = SignatureRequestType.ETHEREUM_RAW;
    if (this.options.secretType && this.options.secretType == SecretType.ETHEREUM) {
      type = SignatureRequestType.ETHEREUM_RAW;
    } else if (this.options.secretType && this.options.secretType == SecretType.MATIC) {
      type = SignatureRequestType.MATIC_RAW;
    } else if (this.options.secretType && this.options.secretType == SecretType.BSC) {
      type = SignatureRequestType.BSC_RAW;
    } else if (this.options.secretType && this.options.secretType == SecretType.AVAC) {
      type = SignatureRequestType.AVAC_RAW;
    }
    return signer.signTransaction({
        type: type,
        walletId: this.getWalletIdFrom(address),
        data: data
      })
      .then((result) => {
        if (result.status === 'SUCCESS') {
          return result.result.signature;
        } else {
          throw new Error((result.errors && result.errors.join(", ")));
        }
      });
  }

  /**
   * Sign an EIP712 Typed Data message. The signing address will associated with the provided address.
   * If you've added this Subprovider to your app's provider, you can simply send an `eth_signTypedData`
   * JSON RPC request, and this method will be called auto-magically.
   * If you are not using this via a ProviderEngine instance, you can call it directly.
   * @param address Address of the account to sign with
   * @param data the typed data object
   * @return Signature hex string (order: rsv)
   */
  public async signTypedDataAsync(address: string,
                                  typedData: any): Promise<string> {
    const signer = this.arkaneConnect.createSigner();
    if (typeof typedData === 'string') {
      typedData = JSON.parse(typedData);
    }
    const request: BuildEip712SignRequestDto = {
      data: typedData,
      walletId: this.getWalletIdFrom(address),
      secretType: this.options.secretType || SecretType.ETHEREUM
    }
    return signer.signEip712(request)
      .then((result) => {
        if (result.status === 'SUCCESS') {
          return result.result.signature;
        } else {
          throw new Error((result.errors && result.errors.join(", ")));
        }
      });
  }

  private getWalletIdFrom(address: string):
    string {
    let foundWallet = this.wallets.find((wallet) => {
      return wallet.address.toLowerCase() === address.toLowerCase();
    });
    return (foundWallet && foundWallet.id) || '';
  }

}
