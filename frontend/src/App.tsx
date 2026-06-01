import { Link, Route, Routes, useLocation } from 'react-router-dom'
import { ConnectButton } from '@mysten/dapp-kit-react/ui'
import { useCurrentAccount } from '@mysten/dapp-kit-react'
import { Landing } from './pages/Landing'
import { Markets } from './pages/Markets'
import { Builder } from './pages/Builder'
import { Surface } from './pages/Surface'
import { Portfolio } from './pages/Portfolio'
import { Activity } from './pages/Activity'
import { Earn } from './pages/Earn'

export default function App() {
  const account = useCurrentAccount()
  const location = useLocation()
  const isLanding = location.pathname === '/'

  return (
    <div className="min-h-screen bg-bg text-fg">
      {!isLanding && (
        <header className="border-b border-line/60 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" aria-label="Stratos home">
              <img src="/logo-full.svg" alt="Stratos" style={{ height: '44px', width: 'auto' }} />
            </Link>
            <nav className="flex gap-1 text-sm text-fg-2">
              <Link to="/markets" className="rounded-full px-3 py-1.5 hover:bg-surface hover:text-fg transition">Markets</Link>
              <Link to="/builder" className="rounded-full px-3 py-1.5 hover:bg-surface hover:text-fg transition">Builder</Link>
              <Link to="/portfolio" className="rounded-full px-3 py-1.5 hover:bg-surface hover:text-fg transition">Portfolio</Link>
              <Link to="/earn" className="rounded-full px-3 py-1.5 hover:bg-surface hover:text-fg transition">Earn</Link>
              <Link to="/surface" className="rounded-full px-3 py-1.5 hover:bg-surface hover:text-fg transition">Surface</Link>
              <Link to="/activity" className="rounded-full px-3 py-1.5 hover:bg-surface hover:text-fg transition">Activity</Link>
            </nav>
          </div>
          <ConnectButton />
        </header>
      )}

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/markets" element={<Markets />} />
        <Route path="/builder" element={<Builder />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/earn" element={<Earn />} />
        <Route path="/surface" element={<Surface />} />
        <Route path="/activity" element={<Activity />} />
      </Routes>

      {!isLanding && !account && (
        <div className="px-6 pb-6 text-sm text-fg-3">
          Connect a wallet to trade.
        </div>
      )}
    </div>
  )
}