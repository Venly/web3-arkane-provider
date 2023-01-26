const Subprovider = require('@arkane-network/web3-provider-engine/subproviders/subprovider');

export class SignTransactionGasFix extends Subprovider {
  /**
   * This method conforms to the web3-provider-engine interface.
   * It is called internally by the ProviderEngine when it is this subproviders
   * turn to handle a JSON RPC request.
   * @param payload JSON RPC payload
   * @param next Callback to call if this subprovider decides not to handle the request
   * @param end Callback to call if subprovider handled the request and wants to pass back the request.
   */
  // tslint:disable-next-line:prefer-function-over-method async-suffix
  public async handleRequest(payload: any, next: any, end: any): Promise<void> {

    switch (payload.method) {
      case 'eth_signTransaction':
        if (payload.params && payload.params.length > 0 && payload.params[0]) {
          if (!payload.params[0].gas) {
            payload.params[0].gas = "";
          }
          next();
        }
        return;

      default:
        next();
        return;
    }
  }

}
