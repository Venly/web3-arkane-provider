const HookedWalletSubprovider = require('web3-provider-engine/subproviders/hooked-wallet.js');
const ArkaneAPI = require('./arkane-api');
const readlineSync = require('readline-sync');

/*
 * Ethereum wallet provider that user pustom private key server for signing
 * No keys are stored client side
 * @constructor
 * @param {string} apiKey: authentication token
 * @param {string} baseUrl of the API
 */
function ArkaneSubProvider(apiKey, baseUrl) {
  const api = new ArkaneAPI(apiKey, baseUrl);

  return new HookedWalletSubprovider({
    /*
     * Fetches user ethereum account
     */
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
    /*
     * Signs transaction
     * If chainId is provided - uses EIP155 pro prevent replay attacks
     * If not - falls back to normal signature scheme
     */
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
}

module.exports = ArkaneSubProvider;