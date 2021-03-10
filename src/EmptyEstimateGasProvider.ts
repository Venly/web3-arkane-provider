import { JSONRPCRequestPayload } from 'ethereum-types';
import { Callback, ErrorCallback } from '@0x/subproviders/lib/src/types';
import { Subprovider } from '@0x/subproviders';
import { ArkaneWalletSubProvider } from './ArkaneWalletSubProvider';

export class EmptyEstimateGasProvider extends Subprovider {


  /**
   * This method conforms to the web3-provider-engine interface.
   * It is called internally by the ProviderEngine when it is this subproviders
   * turn to handle a JSON RPC request.
   * @param payload JSON RPC payload
   * @param next Callback to call if this subprovider decides not to handle the request
   * @param end Callback to call if subprovider handled the request and wants to pass back the request.
   */
  // tslint:disable-next-line:prefer-function-over-method async-suffix
  public async handleRequest(payload: JSONRPCRequestPayload,
                             next: Callback,
                             end: ErrorCallback): Promise<void> {

    switch (payload.method) {
      case 'eth_estimateGas':
        end(null, '');
        return;

      default:
        next();
        return;
    }
  }

}
