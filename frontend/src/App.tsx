import { Link, Route, Routes } from 'react-router-dom'
import { ConnectButton } from '@mysten/dapp-kit-react/ui'
import { useCurrentAccount } from '@mysten/dapp-kit-react'
import { Markets } from './pages/Markets'
import { Builder } from './pages/Builder'
import { Surface } from './pages/Surface'
import { Portfolio } from './pages/Portfolio'
import { Activity } from './pages/Activity'

export default function App() {
  const account = useCurrentAccount()

  return (
    <div className="min-h-screen bg-bg text-fg">
      <header className="border-b border-line/60 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-xl font-semibold tracking-tight">Stratos</Link>
          <nav className="flex gap-1 text-sm text-fg-2">
            <Link to="/markets" className="rounded-full px-3 py-1.5 hover:bg-surface hover:text-fg transition">Markets</Link>
            <Link to="/builder" className="rounded-full px-3 py-1.5 hover:bg-surface hover:text-fg transition">Builder</Link>
            <Link to="/portfolio" className="rounded-full px-3 py-1.5 hover:bg-surface hover:text-fg transition">Portfolio</Link>
            <Link to="/surface" className="rounded-full px-3 py-1.5 hover:bg-surface hover:text-fg transition">Surface</Link>
            <Link to="/activity" className="rounded-full px-3 py-1.5 hover:bg-surface hover:text-fg transition">Activity</Link>
          </nav>
        </div>
        <ConnectButton />
      </header>

      <Routes>
        <Route path="/" element={<Markets />} />
        <Route path="/markets" element={<Markets />} />
        <Route path="/builder" element={<Builder />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/surface" element={<Surface />} />
        <Route path="/activity" element={<Activity />} />
      </Routes>

      {!account && (
        <div className="px-6 pb-6 text-sm text-fg-3">
          Connect a wallet to trade.
        </div>
      )}
    </div>
  )
}
