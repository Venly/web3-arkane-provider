import { createScaffoldMiddleware, mergeMiddleware } from 'json-rpc-engine';
import { createWalletMiddleware } from '@metamask/eth-json-rpc-middleware';
import {
  createPendingNonceMiddleware,
  createPendingTxMiddleware,
} from './pending';
import { createRequestAccountsMiddleware, createSwitchEthereumChainMiddleware } from './accounts';

export default function createVenlyMiddleware({
  getAccounts,
  processDecryptMessage,
  processEncryptionPublicKey,
  processEthSignMessage,
  processPersonalMessage,
  processTransaction,
  processSignTransaction,
  processTypedMessage,
  processTypedMessageV3,
  processTypedMessageV4,
  getPendingNonce,
  getPendingTransactionByHash,
  changeSecretType
}: any) {
  const venlyMiddleware = mergeMiddleware([
    createScaffoldMiddleware({
      web3_clientVersion: 'VenlyProvider/v3.0.0',
      eth_hashrate: '0x00',
      eth_mining: false,
      eth_syncing: true
    }),
    createWalletMiddleware({
      getAccounts,
      processDecryptMessage,
      processEncryptionPublicKey,
      processEthSignMessage,
      processPersonalMessage,
      processTransaction,
      processSignTransaction,
      processTypedMessage,
      processTypedMessageV3,
      processTypedMessageV4,
    }) as any,
    createRequestAccountsMiddleware({ getAccounts }),
    createPendingNonceMiddleware({ getPendingNonce }),
    createPendingTxMiddleware({ getPendingTransactionByHash }),
    createSwitchEthereumChainMiddleware({ changeSecretType }),
  ]);
  return venlyMiddleware;
}