import { Link, Route, Routes } from 'react-router-dom'
import { ConnectButton } from '@mysten/dapp-kit-react/ui'
import { useCurrentAccount } from '@mysten/dapp-kit-react'
import { Markets } from './pages/Markets'
import { Builder } from './pages/Builder'
import { Surface } from './pages/Surface'

export default function App() {
  const account = useCurrentAccount()

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-xl font-semibold tracking-tight">Stratos</Link>
          <nav className="flex gap-4 text-sm text-zinc-400">
            <Link to="/markets" className="hover:text-zinc-100">Markets</Link>
            <Link to="/builder" className="hover:text-zinc-100">Builder</Link>
            <Link to="/surface" className="hover:text-zinc-100">Surface</Link>
          </nav>
        </div>
        <ConnectButton />
      </header>

      <Routes>
        <Route path="/" element={<Markets />} />
        <Route path="/markets" element={<Markets />} />
        <Route path="/builder" element={<Builder />} />
        <Route path="/surface" element={<Surface />} />
      </Routes>

      {!account && (
        <div className="px-6 pb-6 text-xs text-zinc-500">
          Connect a wallet to trade.
        </div>
      )}
    </div>
  )
}
