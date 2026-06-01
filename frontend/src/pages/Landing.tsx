import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ConnectButton } from '@mysten/dapp-kit-react/ui'
import {
  Layers,
  Shield,
  History,
  Activity,
  Radio,
  Boxes,
  PiggyBank,
  Package,
  FileCode2,
  FunctionSquare,
  Zap,
  Globe,
  ListChecks,
  type LucideIcon,
} from 'lucide-react'
import { STRATOS_PACKAGE_ID } from '../config/constants'
import { explorerObjectUrl } from '../lib/explorer'
import { useOracles } from '../hooks/useOracles'
import { useOracleState } from '../hooks/useOracleState'
import { useStrategyActivity } from '../hooks/useStrategyActivity'

const GITHUB_URL = 'https://github.com/Thunderroar/Stratos'

export function Landing() {
  const packageHref = explorerObjectUrl(STRATOS_PACKAGE_ID)
  const { data: oracles } = useOracles()
  const btcOracle = useMemo(
    () => oracles?.find((o) => o.status === 'active' && o.underlying_asset === 'BTC') ?? null,
    [oracles],
  )
  const { data: btcState } = useOracleState(btcOracle?.oracle_id)
  const btcSpot = btcState?.latest_price?.spot ? btcState.latest_price.spot / 1e9 : null
  const { data: activity } = useStrategyActivity(200)
  const strategyCount = activity?.length ?? 0

  return (
    <div>
      <header className="bg-bg px-6 py-4 flex items-center justify-between">
        <Link to="/" aria-label="Stratos home">
          <img src="/logo-full.svg" alt="Stratos" style={{ height: '44px', width: 'auto' }} />
        </Link>
        <ConnectButton />
      </header>

      <main className="bg-dotted-grid">
        <section className="relative px-6 py-24 max-w-5xl mx-auto text-center overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center" aria-hidden="true">
            <div className="hero-blob-1 h-112 w-md rounded-full bg-accent/25 blur-3xl" />
            <div className="hero-blob-2 absolute h-80 w-80 rounded-full bg-analytical/20 blur-2xl" />
            <div className="hero-blob-3 absolute h-64 w-64 rounded-full bg-accent/15 blur-2xl" />
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-line/60 bg-surface/80 backdrop-blur px-3 py-1 text-xs text-fg-2 mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Sui Overflow 2026
          </div>

          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight leading-tight">
            Multi-leg options strategies
            <br />
            <span className="text-accent">on DeepBook Predict.</span>
          </h1>

          <p className="mt-6 text-lg text-fg-2 max-w-2xl mx-auto leading-relaxed">
            Compose, price, and execute atomically on Sui. Built on our own Move
            executor module with live Greeks, intraday backtesting, and on-chain
            strategy events.
          </p>
          <LiveStrip btcSpot={btcSpot} strategyCount={strategyCount} />
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/markets"
              className="rounded-full bg-accent hover:bg-accent/90 px-6 py-3 text-sm font-semibold text-bg transition shadow-lg shadow-accent/20"
            >
              Try Demo →
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-line bg-surface hover:bg-surface-elev px-6 py-3 text-sm font-semibold text-fg transition"
            >
              View on GitHub
            </a>
          </div>
        </section>

        <section className="px-6 py-16 max-w-5xl mx-auto">
          <div className="flex gap-6 items-start">
            <div className="hidden md:block w-1 self-stretch bg-linear-to-b from-accent via-accent/40 to-transparent rounded-full shrink-0" />
            <div>
              <SectionLabel accent="bg-accent">The problem</SectionLabel>
              <p className="mt-4 text-2xl text-fg-2 leading-relaxed">
                DeFi options haven't scaled because retail users can't construct
                multi-leg strategies without quantitative finance expertise. TradFi
                platforms drove options volume 10× by making complex strategies
                one-click. DeepBook Predict provides the on-chain primitives.{' '}
                <span className="text-fg font-medium">Stratos provides the interface.</span>
              </p>
            </div>
          </div>
        </section>

        <section className="px-6 py-16 max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <SectionLabel accent="bg-profit" centered>What's inside</SectionLabel>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Feature
              accent="bg-accent"
              iconColor="text-accent"
              icon={Layers}
              title="Strategy Builder"
              body="Four binary-native templates - bull/bear ladder, strangle, range bet - with live cost preview from on-chain pricing."
            />
            <Feature
              accent="bg-profit"
              iconColor="text-profit"
              icon={Shield}
              title="Risk Panel"
              body="Bloomberg-grade Greeks: Delta, Theta, max profit/loss, probability of profit via Monte Carlo on the live SVI surface."
            />
            <Feature
              accent="bg-analytical"
              iconColor="text-analytical"
              icon={History}
              title="Intraday Backtest"
              body="Replay any strategy against historical SVI snapshots. See exactly how its mark value would have evolved."
            />
            <Feature
              accent="bg-amber"
              iconColor="text-amber"
              icon={Activity}
              title="Volatility Surface"
              body="Live implied vol smile derived from on-chain oracle params - the same model Predict uses to price every trade."
            />
            <Feature
              accent="bg-warn"
              iconColor="text-warn"
              icon={Radio}
              title="Activity Feed"
              body="Every strategy executed through Stratos emits a typed event. Live, queryable, no indexer required."
            />
            <Feature
              accent="bg-loss"
              iconColor="text-loss"
              icon={Boxes}
              title="Move Executor"
              body="Our own Move module on testnet. Strategies are named, validated, event-emitting primitives — not anonymous mints."
            />
            <Feature
              accent="bg-cyan"
              iconColor="text-cyan"
              icon={PiggyBank}
              title="Vault Yield"
              body="Supply DUSDC to Predict's liquidity vault and earn yield from option premiums. You are the protocol's counterparty — every losing trade flows back to LPs."
              className="lg:col-start-2"
            />
          </div>
        </section>

        <section className="px-6 py-16 max-w-5xl mx-auto">
          <div className="rounded-2xl border border-line/60 bg-surface p-8">
            <SectionLabel accent="bg-accent">On-chain</SectionLabel>

            <dl className="mt-5 space-y-3 text-sm">
              <Row icon={Package} label="Move package">
                {packageHref ? (
                  <a
                    href={packageHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-accent hover:text-accent/80 underline underline-offset-2 text-xs break-all"
                  >
                    {STRATOS_PACKAGE_ID}
                  </a>
                ) : (
                  <span className="font-mono text-xs">{STRATOS_PACKAGE_ID}</span>
                )}
              </Row>
              <Row icon={FileCode2} label="Module">
                <span className="font-mono text-fg text-xs">stratos::executor</span>
              </Row>
              <Row icon={FunctionSquare} label="Functions">
                <span className="font-mono text-fg text-xs">
                  execute_bull_ladder · execute_bear_ladder · execute_strangle · execute_range_bet
                </span>
              </Row>
              <Row icon={Zap} label="Event">
                <span className="font-mono text-fg text-xs">StrategyExecuted</span>
              </Row>
              <Row icon={Globe} label="Network">
                <span className="text-fg text-xs">Sui Testnet</span>
              </Row>
              <Row icon={ListChecks} label="Strategies executed">
                <span className="font-mono text-fg text-xs inline-flex items-center gap-2">
                  <LivePulse />
                  <CountUp value={strategyCount} />
                </span>
              </Row>
            </dl>
          </div>
        </section>

        <section className="relative px-6 pt-20 pb-56 text-center overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
            <div
              className="absolute inset-x-0 bottom-0 w-full"
              style={{
                height: '100%',
                background:
                  'linear-gradient(to top, rgba(37, 99, 235, 0.9) 0%, rgba(37, 99, 235, 0.65) 20%, rgba(37, 99, 235, 0.35) 50%, rgba(37, 99, 235, 0.15) 75%, transparent 100%)',
              }}
            />
            <svg
              className="absolute inset-x-0 bottom-0 w-full"
              style={{ height: '85%' }}
              preserveAspectRatio="none"
              viewBox="0 0 1440 900"
            >
              <defs>
                <filter id="cloudBlur" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="60" />
                </filter>
              </defs>
              <g filter="url(#cloudBlur)">
                <path
                  d="M-100,500 C200,350 450,600 700,420 C950,250 1200,520 1540,380 L1540,1000 L-100,1000 Z"
                  fill="#2563EB"
                />
                <path
                  d="M-100,650 C300,520 550,720 800,580 C1050,440 1300,700 1540,560 L1540,1000 L-100,1000 Z"
                  fill="#1D4ED8"
                  opacity="0.85"
                />
              </g>
            </svg>

            <div
              className="grain absolute inset-x-0 bottom-0 opacity-40"
              style={{
                height: '70%',
                maskImage: 'linear-gradient(to top, black 50%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to top, black 50%, transparent 100%)',
              }}
            />

            <div className="absolute bottom-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />
          </div>

          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">
              Ready to build a strategy?
            </h2>
            <p className="mt-5 text-lg text-fg-2">
              Connect a Slush wallet on Sui testnet to mint, manage, and redeem options strategies.
            </p>
            <div className="mt-10">
              <Link
                to="/builder"
                className="inline-flex items-center gap-2 rounded-full bg-accent hover:bg-accent/90 px-8 py-4 text-base font-semibold text-bg transition shadow-2xl shadow-accent/40"
              >
                Launch app →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line/60 px-6 py-6 text-xs text-fg-3 flex flex-wrap items-center justify-between gap-3">
        <div>Stratos · Built for Sui Overflow 2026</div>
        <div className="flex items-center gap-4">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-fg transition"
          >
            GitHub
          </a>
          <Link to="/markets" className="hover:text-fg transition">
            App
          </Link>
        </div>
      </footer>
    </div>
  )
}

function LivePulse() {
  return (
    <span className="relative inline-flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-profit opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-profit" />
    </span>
  )
}

function LiveStrip({ btcSpot, strategyCount }: { btcSpot: number | null; strategyCount: number }) {
  return (
    <div className="mt-8 inline-flex items-center gap-5 text-xs text-fg-3 font-medium">
      <span className="inline-flex items-center gap-2">
        <LivePulse />
        BTC
        <span className="text-fg font-mono font-semibold">
          {btcSpot != null ? `$${btcSpot.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '—'}
        </span>
      </span>
      <span className="text-fg-3">·</span>
      <span className="inline-flex items-center gap-2">
        <span className="text-fg font-mono font-semibold">
          <CountUp value={strategyCount} />
        </span>
        strategies executed
      </span>
    </div>
  )
}

function CountUp({ value, duration = 800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(value)

  useEffect(() => {
    const start = display
    const startTime = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(start + (value - start) * eased))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <>{display.toLocaleString()}</>
}

function Feature({
  accent, iconColor, icon: Icon, title, body, className = '',
}: {
  accent: string
  iconColor: string
  icon: LucideIcon
  title: string
  body: string
  className?: string
}) {
  return (
    <div className={`rounded-2xl border border-line/60 bg-surface p-6 transition hover:border-accent/30 hover:-translate-y-0.5 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`h-1 w-8 rounded-full ${accent}`} />
        <Icon className={`h-5 w-5 ${iconColor}`} strokeWidth={1.5} />
      </div>
      <h3 className="text-base font-semibold mb-2">{title}</h3>
      <p className="text-sm text-fg-2 leading-relaxed">{body}</p>
    </div>
  )
}

function SectionLabel({
  accent, centered, children,
}: {
  accent: string
  centered?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`inline-flex items-center gap-2 ${centered ? 'justify-center' : ''}`}>
      <span className={`h-2 w-2 rounded-sm ${accent}`} />
      <span className="text-[11px] uppercase tracking-wider text-fg-3 font-semibold">{children}</span>
    </div>
  )
}

function Row({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-4 flex-wrap">
      <dt className="text-fg-3 w-52 shrink-0 inline-flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-fg-3" strokeWidth={1.5} />
        {label}
      </dt>
      <dd>{children}</dd>
    </div>
  )
}