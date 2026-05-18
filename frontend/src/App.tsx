import { Link, Route, Routes } from 'react-router-dom'
import { ConnectButton } from '@mysten/dapp-kit-react/ui'
import { useCurrentAccount } from '@mysten/dapp-kit-react'
import { Markets } from './pages/Markets'

export default function App() {
  const account = useCurrentAccount()

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-xl font-semibold tracking-tight">Stratos</Link>
          <nav className="flex gap-4 text-sm text-zinc-400">
            <Link to="/markets" className="hover:text-zinc-100">Markets</Link>
          </nav>
        </div>
        <ConnectButton />
      </header>

      <Routes>
        <Route path="/" element={<Markets />} />
        <Route path="/markets" element={<Markets />} />
      </Routes>

      {!account && (
        <div className="px-6 pb-6 text-xs text-zinc-500">
          Connect a wallet to trade.
        </div>
      )}
    </div>
  )
}
