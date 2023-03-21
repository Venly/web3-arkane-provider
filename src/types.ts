export const CHAIN_IDS: { [id: string]: any } = {
  AVAC: {
    prod: 0xA86A,
    staging: 0xA869,
    qa: 0xA869
  },
  BSC: {
    prod: 0x38,
    staging: 0x61,
    qa: 0x61
  },
  ETHEREUM: {
    prod: 0x1,
    staging: 0x4,
    qa: 0x5
  },
  GOCHAIN: {
    prod: 0x3c,
    staging: 0x7a69,
    qa: 0x7a69
  },
  HEDERA: {
    prod: 0x127,
    staging: 0x128,
    qa: 0x128
  },
  VECHAIN: {
    prod: 0x186a9,
    staging: 0x186aa,
    qa: 0x186aa
  },
  MATIC: {
    prod: 0x89,
    staging: 0x13881,
    qa: 0x13881
  },
}

export const SECRET_TYPES: { [id: number]: any } = {
  0xA86A: {
    env: 'prod',
    secretType: 'AVAC',
  },
  0xA869: {
    env: 'staging',
    secretType: 'AVAC',
  },
  0x38: {
    env: 'prod',
    secretType: 'BSC',
  },
  0x61: {
    env: 'staging',
    secretType: 'BSC',
  },
  0x1: {
    env: 'prod',
    secretType: 'ETHEREUM',
  },
  0x5: {
    env: 'staging',
    secretType: 'ETHEREUM',
  },
  0x3c: {
    env: 'prod',
    secretType: 'GOCHAIN',
  },
  0x7a69: {
    env: 'staging',
    secretType: 'GOCHAIN',
  },
  0x127: {
    env: 'prod',
    secretType: 'HEDERA',
  },
  0x128: {
    env: 'staging',
    secretType: 'HEDERA',
  },
  0x186a9: {
    env: 'prod',
    secretType: 'VECHAIN',
  },
  0x186aa: {
    env: 'staging',
    secretType: 'VECHAIN',
  },
  0x89: {
    env: 'prod',
    secretType: 'MATIC',
  },
  0x13881: {
    env: 'staging',
    secretType: 'MATIC',
  },
}

export const REQUEST_TYPES: { [id: string]: any } = {
  AVAC: {
    transaction: 'AVAC_TRANSACTION',
    signature: 'AVAC_TRANSACTION',
  },
  BSC: {
    transaction: 'BSC_TRANSACTION',
    signature: 'BSC_TRANSACTION',
  },
  ETHEREUM: {
    transaction: 'ETH_TRANSACTION',
    signature: 'ETHEREUM_TRANSACTION',
  },
  GOCHAIN: {
    transaction: 'GO_TRANSACTION',
    signature: 'GOCHAIN_TRANSACTION',
  },
  VECHAIN: {
    transaction: 'VET_TRANSACTION',
    signature: 'VECHAIN_TRANSACTION',
  },
  MATIC: {
    transaction: 'MATIC_TRANSACTION',
    signature: 'MATIC_TRANSACTION',
  },
}