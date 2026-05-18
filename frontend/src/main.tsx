import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DAppKitProvider } from '@mysten/dapp-kit-react'
import { createDAppKit } from '@mysten/dapp-kit-core'
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from '@mysten/sui/jsonRpc'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

const dAppKit = createDAppKit({
  networks: ['testnet'],
  defaultNetwork: 'testnet',
  createClient: (network) =>
    new SuiJsonRpcClient({
      url: getJsonRpcFullnodeUrl(network),
      network,
    }),
})

declare module '@mysten/dapp-kit-core' {
  interface Register {
    dAppKit: typeof dAppKit
  }
}

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <DAppKitProvider dAppKit={dAppKit}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </DAppKitProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
