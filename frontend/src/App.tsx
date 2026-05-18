import { useCurrentAccount } from '@mysten/dapp-kit-react'
import { ConnectButton } from '@mysten/dapp-kit-react/ui'

export default function App() {
  const account = useCurrentAccount()

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-semibold tracking-tight">Stratos</span>
          <span className="text-xs text-zinc-500">options on DeepBook Predict</span>
        </div>
        <ConnectButton />
      </header>

      <main className="p-6">
        {account ? (
          <div className="text-sm text-zinc-400">
            Connected as <span className="font-mono text-zinc-200">{account.address}</span>
          </div>
        ) : (
          <div className="text-sm text-zinc-500">Connect a wallet to begin.</div>
        )}
      </main>
    </div>
  )
}
