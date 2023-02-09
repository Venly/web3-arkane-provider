export interface PartialTxParams {
  nonce: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  gas: string;
  to: string;
  from: string;
  value?: string;
  data?: string;
  type?: number;
  accessList?: Array<{ address: string; storageKeys: string[] }>;
}

export enum WalletSubproviderErrors {
  AddressNotFound = 'ADDRESS_NOT_FOUND',
  DataMissingForSignPersonalMessage = 'DATA_MISSING_FOR_SIGN_PERSONAL_MESSAGE',
  DataMissingForSignTypedData = 'DATA_MISSING_FOR_SIGN_TYPED_DATA',
  SenderInvalidOrNotSupplied = 'SENDER_INVALID_OR_NOT_SUPPLIED',
  FromAddressMissingOrInvalid = 'FROM_ADDRESS_MISSING_OR_INVALID',
  MethodNotSupported = 'METHOD_NOT_SUPPORTED',
}

export enum WindowMode {
  POPUP = "POPUP",
  REDIRECT = "REDIRECT"
}