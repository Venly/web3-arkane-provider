const TRANSACTION_ENVELOPE_TYPES = {
  LEGACY: '0x0',
  ACCESS_LIST: '0x1',
  FEE_MARKET: '0x2',
};

export function formatTxMetaForRpcResult(txMeta: any) {
  const { r, s, v, hash, txReceipt, txParams } = txMeta;
  const {
    to,
    data,
    nonce,
    gas,
    from,
    value,
    gasPrice,
    accessList,
    maxFeePerGas,
    maxPriorityFeePerGas,
  } = txParams;

  const formattedTxMeta: any = {
    v,
    r,
    s,
    to,
    gas,
    from,
    hash,
    nonce,
    input: data || '0x',
    value: value || '0x0',
    accessList: accessList || null,
    blockHash: txReceipt?.blockHash || null,
    blockNumber: txReceipt?.blockNumber || null,
    transactionIndex: txReceipt?.transactionIndex || null,
  };

  if (maxFeePerGas && maxPriorityFeePerGas) {
    formattedTxMeta.gasPrice = maxFeePerGas;
    formattedTxMeta.maxFeePerGas = maxFeePerGas;
    formattedTxMeta.maxPriorityFeePerGas = maxPriorityFeePerGas;
    formattedTxMeta.type = TRANSACTION_ENVELOPE_TYPES.FEE_MARKET;
  } else {
    formattedTxMeta.gasPrice = gasPrice;
    formattedTxMeta.type = TRANSACTION_ENVELOPE_TYPES.LEGACY;
  }

  return formattedTxMeta;
}

/**
 * Wait the specified number of milliseconds.
 *
 * @param duration - The number of milliseconds to wait.
 * @returns A promise that resolves after the specified amount of time.
 */
export async function timeout(duration: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, duration));
}