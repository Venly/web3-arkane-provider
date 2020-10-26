import { JSONRPCRequestPayload }   from 'ethereum-types';
import { Callback, ErrorCallback } from '@0x/subproviders/lib/src/types';
import { Subprovider }             from '@0x/subproviders';
import { ArkaneWalletSubProvider } from './ArkaneWalletSubProvider';

export class SignedVersionedTypedDataSubProvider extends Subprovider {

    private arkaneWalletSubProvider: ArkaneWalletSubProvider;

    constructor(arkaneWalletSubProvider: ArkaneWalletSubProvider) {
        super();
        this.arkaneWalletSubProvider = arkaneWalletSubProvider;
    }

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
            case 'eth_signTypedData_v4':
            case 'eth_signTypedData_v3':
            case 'eth_signTypedData_v2':
                if (!payload.params[0] || !payload.params[1]) {
                    end(new Error('Missing parameters for signing data, 2 params needed: address, eip712Data'));
                } else {
                    let result = await this.arkaneWalletSubProvider.signTypedDataAsync(payload.params[0], payload.params[1]);
                    end(null, result);
                }
                return;

            default:
                next();
                return;
        }
    }

}
