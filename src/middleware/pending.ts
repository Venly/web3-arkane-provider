import { createAsyncMiddleware } from 'json-rpc-engine';
import { formatTxMetaForRpcResult } from '../util';

export function createPendingNonceMiddleware({ getPendingNonce }: any) {
  return createAsyncMiddleware(async (req, res, next) => {
    const { method, params } = req;
    if (method !== 'eth_getTransactionCount') {
      next();
      return;
    }
    const [param, blockRef]: any = params;
    if (blockRef !== 'pending') {
      next();
      return;
    }
    await next();
    // res.result = await getPendingNonce(res.result);
  });
}

export function createTransactionByHashMiddleware({ getTransactionByHash }: any) {
  return createAsyncMiddleware(async (req, res, next) => {
    const { method, params } = req;
    if (method !== 'eth_getTransactionByHash') {
      next();
      return;
    }
    const [hash]: any = params;
    res.result = await getTransactionByHash(hash);
  });
}

export function createPendingTransactionsMiddleware({ getPendingTransactions }: any) {
  return createAsyncMiddleware(async (req, res, next) => {
    if (req.method !== 'eth_pendingTransactions') {
      next();
      return;
    }
    res.result = await getPendingTransactions();
  });
}