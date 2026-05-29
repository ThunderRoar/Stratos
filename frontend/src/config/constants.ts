// If the constants change, refer to the documentation https://docs.sui.io/onchain-finance/deepbook-predict/contract-information

export const NETWORK = 'testnet' as const
export const PREDICT_SERVER_URL = 'https://predict-server.testnet.mystenlabs.com'
export const PREDICT_PACKAGE_ID = '0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138'
export const PREDICT_REGISTRY_ID = '0x43af14fed5480c20ff77e2263d5f794c35b9fab7e2212903127062f4fe2a6e64'
export const PREDICT_OBJECT_ID = '0xc8736204d12f0a7277c86388a68bf8a194b0a14c5538ad13f22cbd8e2a38028a'
export const QUOTE_ASSET_TYPE = '0xe95040085976bfd54a1a07225cd46c8a2b4e8e2b6732f140a0fc49850ba73e1a::dusdc::DUSDC'
export const DUSDC_CURRENCY_ID = '0xf3000dff421833d4bb8ed58fac146d691a3aaba2785aa1989af65a7089ca3e9c'
export const PLP_COIN_TYPE = '0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138::plp::PLP'
export const DUSDC_DECIMALS = 6
export const STRATOS_PACKAGE_ID = '0x1353e53419f8c227df2e85817cf8bfbdb08c290d01f5dbdfe44058fb19dcbcfa'
export const EXPLORER_BASE = `https://suiscan.xyz/${NETWORK}`

if (NETWORK !== 'testnet') {
  // eslint-disable-next-line no-console
  console.warn(
    `Stratos is currently testnet-only. NETWORK="${NETWORK}" — contract addresses in this file are testnet IDs and will not resolve on other networks.`,
  )
}