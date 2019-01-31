import {ArkaneConnect, SecretType, SignMethod, Wallet} from "@arkane-network/arkane-connect"
import {EIP712TypedData, PartialTxParams} from "@0x/subproviders";
import {BaseWalletSubprovider} from "@0x/subproviders/lib/src/subproviders/base_wallet_subprovider";

export class ArkaneSubProvider extends BaseWalletSubprovider {

    readonly arkaneConnect: ArkaneConnect;
    private wallets: Wallet[] = [];

    constructor(clientId: string, options?: ArkaneSubProviderOptions) {
        super();
        this.arkaneConnect = new ArkaneConnect(clientId, {environment: (options && options.environment) || 'staging'});
    }

    /**
     * Retrieve the accounts associated with the eth-lightwallet instance.
     * This method is implicitly called when issuing a `eth_accounts` JSON RPC request
     * via your providerEngine instance.
     *
     * @return An array of accounts
     */
    public async getAccountsAsync(): Promise<string[]> {
        const currentClass = this;
        console.log('getting wallets async');
        return this.arkaneConnect.api.getWallets({secretType: SecretType.ETHEREUM})
            .then(returnedWallets => {
                console.log("wallets returned");
                console.log(returnedWallets);
                currentClass.wallets = returnedWallets;
                return returnedWallets.map(x => x.address);
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
        let signer = this.arkaneConnect.createSigner(SignMethod.POPUP);
        return signer.signTransaction(this.constructEthereumTransationSignatureRequest(txParams))
            .then((result) => {
                return result.result;
            })
    }

    private constructEthereumTransationSignatureRequest(txParams: PartialTxParams) {
        return {
            gasPrice: txParams.gasPrice ? parseInt(txParams.gasPrice, 16) : txParams.gasPrice,
            gas: txParams.gas ? parseInt(txParams.gas, 16) : txParams.gas,
            to: txParams.to,
            nonce: txParams.nonce ? parseInt(txParams.nonce, 16) : txParams.nonce,
            data: txParams.data,
            value: txParams.value ? parseInt(txParams.value, 16) : 0,
            submit: false,
            type: 'ETHEREUM_TRANSACTION',
            walletId: this.getWalletIdFrom(txParams)
        }
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
    public async signPersonalMessageAsync(data: string, address: string): Promise<string> {
        return Promise.reject('not implemented yet');
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
    public async signTypedDataAsync(address: string, typedData: EIP712TypedData): Promise<string> {
        return Promise.reject('Not implemented yet');
    }


    /*
    return new HookedWalletSubprovider({
      getAccounts: async (cb) => {
        if (!this.walletId || !this.address) {
          console.log("Getting your Arkane wallet...");
          const wallets = await api.getWallets();
          if (wallets.status === 200 && wallets.data.success) {
            const wallet = wallets.data.result[0];
            this.walletId = wallet.id;
            this.address = wallet.address;
            console.log("Using arkane wallet: " + this.address);
            if (cb) {
              cb(null, [this.address]);
            } else {
              return [this.address];
            }
          } else {
            console.log('Something went wrong while trying to fetch the wallets');
            if (cb) {
              cb('Something went wrong while trying to fetch the wallets');
            }
          }
        } else {
          console.log("Using arkane wallet: " + this.address);
          if (cb) {
            cb(null, [this.address]);
          } else {
            return [this.address];
          }
        }

      },
      signTransaction: async (txParams, cb) => {
        console.log("Signing transaction using Arkane...");
        if (!this.pincode) {
          this.pincode = readlineSync.question('What is your Arkane pincode? ', {
            hideEchoBack: true
          });

        }

        let request = constructEthereumTransationSignatureRequest(txParams, this.walletId, this.pincode);
        const signatureResult = await api.sign((request));
        if (signatureResult.status === 200 && signatureResult.data.success) {
          console.log("Transaction was signed using Arkane");
          if (cb) {
            cb(null, signatureResult.data.result.signedTransaction);
          } else {
            return signatureResult.data.result.signedTransaction;
          }
        } else {
          if (cb) {
            cb('something went wrong while trying to create a signature');
          }
        }
      }
    });

    function constructEthereumTransationSignatureRequest(txParams, walletId, pincode) {
      return {
        gasPrice: txParams.gasPrice ? parseInt(txParams.gasPrice, 16) : txParams.gasPrice,
        gas: txParams.gas ? parseInt(txParams.gas, 16) : txParams.gas,
        to: txParams.to,
        nonce: txParams.nonce ? parseInt(txParams.nonce, 16) : txParams.nonce,
        data: txParams.data,
        value: txParams.value ? parseInt(txParams.value, 16) : 0,
        submit: false,
        type: 'ETHEREUM_TRANSACTION',
        walletId: walletId,
        pincode: pincode
      }
    }
    */
    private getWalletIdFrom(txParams: PartialTxParams): string {
        let foundWallet = this.wallets.find((wallet) => {
            return wallet.address === txParams.from;
        });
        return (foundWallet && foundWallet.id) || '';
    }
}

export interface ArkaneSubProviderOptions {
    environment?: string
}