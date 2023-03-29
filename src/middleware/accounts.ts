import { createAsyncMiddleware } from 'json-rpc-engine';
import { SECRET_TYPES } from '../types';

export function createRequestAccountsMiddleware({ getAccounts }: any) {
  return createAsyncMiddleware(async (req, res, next) => {
    if (req.method !== 'eth_requestAccounts') {
      next();
      return;
    }
    res.result = await getAccounts();
  });
}

export function createSwitchEthereumChainMiddleware({ changeSecretType }: any) {
  return createAsyncMiddleware(async (req, res, next) => {
    if (req.method !== 'wallet_switchEthereumChain') {
      next();
      return;
    }
    const chainId = (req.params as any)[0]?.chainId;
    const chain = SECRET_TYPES[Number(chainId)];
    
    if (chain && await changeSecretType(chain.secretType, chainId))
      res.result = null;
    else
      res.error = { code: -32602, message: 'Chain not supported' };
  });
}