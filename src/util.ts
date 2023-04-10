const utf8 = require('utf8');

/**
 * Should be called to get utf8 from it's hex representation
 *
 * @method hexToUtf8
 * @param {String} hex
 * @returns {String} ascii string representation of hex value
 */
export function hexToUtf8(hex: string) {
  if (!isHexStrict(hex))
      throw new Error('The parameter "'+ hex +'" must be a valid HEX string.');

  var str = "";
  var code = 0;
  hex = hex.replace(/^0x/i,'');

  // remove 00 padding from either side
  hex = hex.replace(/^(?:00)*/,'');
  hex = hex.split("").reverse().join("");
  hex = hex.replace(/^(?:00)*/,'');
  hex = hex.split("").reverse().join("");

  var l = hex.length;

  for (var i=0; i < l; i+=2) {
      code = parseInt(hex.slice(i, i + 2), 16);
      // if (code !== 0) {
      str += String.fromCharCode(code);
      // }
  }

  return utf8.decode(str);
};

/**
 * Check if string is HEX, requires a 0x in front
 *
 * @method isHexStrict
 * @param {String} hex to be checked
 * @returns {Boolean}
 */
function isHexStrict(hex: string) {
  return ((typeof hex === 'string' || typeof hex === 'number') && /^(-)?0x[0-9a-f]*$/i.test(hex));
};

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