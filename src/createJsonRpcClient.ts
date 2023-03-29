import { createAsyncMiddleware, mergeMiddleware } from 'json-rpc-engine';
import {
  createFetchMiddleware,
  createBlockRefRewriteMiddleware,
  createBlockCacheMiddleware,
  createInflightCacheMiddleware,
  createBlockTrackerInspectorMiddleware
} from '@metamask/eth-json-rpc-middleware';
import { providerFromMiddleware } from '@metamask/eth-json-rpc-provider';
import { PollingBlockTracker } from 'eth-block-tracker';
const MILLISECOND = 1;
const SECOND = MILLISECOND * 1000;

export default function createJsonRpcClient({ rpcUrl, chainId }: any) {
  const blockTrackerOpts = process.env.IN_TEST
    ? { pollingInterval: SECOND }
    : {};
  const fetchMiddleware = createFetchMiddleware({ btoa, fetch, rpcUrl });
  const blockProvider = providerFromMiddleware(fetchMiddleware);
  const blockTracker = new PollingBlockTracker({
    ...blockTrackerOpts,
    provider: blockProvider as any,
  });
  const testMiddlewares = process.env.IN_TEST
    ? [createEstimateGasDelayTestMiddleware()]
    : [];

  const networkMiddleware = mergeMiddleware([
    ...testMiddlewares as any,
    createChainIdMiddleware(chainId),
    createBlockRefRewriteMiddleware({ blockTracker } as any),
    createBlockCacheMiddleware({ blockTracker } as any),
    createInflightCacheMiddleware(),
    createBlockTrackerInspectorMiddleware({ blockTracker } as any),
    fetchMiddleware,
  ]);

  return { networkMiddleware, blockTracker };
}

function createChainIdMiddleware(chainId: any) {
  return (req: any, res: any, next: any, end: any) => {
    if (req.method === 'eth_chainId') {
      res.result = chainId;
      return end();
    }
    return next();
  };
}

/**
 * For use in tests only.
 * Adds a delay to `eth_estimateGas` calls.
 */
function createEstimateGasDelayTestMiddleware() {
  return createAsyncMiddleware(async (req, _, next) => {
    if (req.method === 'eth_estimateGas') {
      await new Promise((resolve) => setTimeout(resolve, SECOND * 2));
    }
    return next();
  });
}
