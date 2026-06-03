import { useVaultSummary } from '../hooks/useVault'
import { PageHeader } from '../components/PageHeader'
import type { VaultSummary } from '../lib/predict-types'
import { useCurrentAccount } from '@mysten/dapp-kit-react'
import { useWalletPlpCoins } from '../hooks/useWalletPlpCoins'
import { SupplyWithdrawForm } from '../components/SupplyWithdrawForm'
import { VaultPerformanceChart } from '../components/VaultPerformanceChart'
import { InfoTooltip } from '../components/InfoTooltip'
import { TrendingUp, Wallet, Unlock, type LucideIcon } from 'lucide-react'


const fmtDusdc = (raw6: number) => (raw6 / 1e6).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

const fmtDusdcCompact = (raw6: number) => {
  const usd = raw6 / 1e6
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(2)}M`
  if (usd >= 1_000) return `$${(usd / 1_000).toFixed(1)}K`
  return `$${usd.toFixed(0)}`
}

const fmtPct = (fraction: number, digits = 2) => `${(fraction * 100).toFixed(digits)}%`
const lifetimeReturnPct = (sharePrice: number) => (sharePrice - 1) * 100

export function Earn() {
  const { data, isLoading, error } = useVaultSummary()

  if (isLoading) return <div className="p-6 text-fg-3">Loading vault…</div>
  if (error) return <div className="p-6 text-loss">Failed to load vault: {error.message}</div>
  if (!data) return null

  return (
    <div className="p-6 space-y-8">
      <PageHeader
        title="Earn"
        subtitle="Supply DUSDC to the Predict vault. Earn yield from option premiums as the protocol's counterparty."
      />

      <HeroStats vault={data} />
      <SecondaryStats vault={data} />
      <YourPosition vault={data} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <VaultPerformanceChart />
        </div>
        <SupplyWithdrawForm vault={data} />
      </div>
    </div>
  )
}

function HeroStats({ vault }: { vault: VaultSummary }) {
  const lifetimePct = lifetimeReturnPct(vault.plp_share_price)
  const returnColor =
    lifetimePct > 0 ? 'text-profit' : lifetimePct < 0 ? 'text-loss' : 'text-fg'
  const returnSign = lifetimePct > 0 ? '+' : ''

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <BigStat
        label="Share price"
        primary={vault.plp_share_price.toFixed(4)}
        icon={TrendingUp}
        iconColor="text-profit"
        tooltip="DUSDC value of one PLP share. Rises as the vault earns trading premiums from traders' net losses. Genesis = 1.0000."
        secondary={
          <span className={returnColor}>
            {returnSign}{lifetimePct.toFixed(2)}% lifetime
          </span>
        }
      />
      <BigStat
        label="Total value locked"
        primary={fmtDusdcCompact(vault.vault_value)}
        icon={Wallet}
        iconColor="text-accent"
        tooltip="Total DUSDC in the vault, including mark-to-market on open trader positions. This is the vault's net worth."
        secondary={<span className="text-fg-3">{fmtDusdc(vault.vault_value)}</span>}
      />
      <BigStat
        label="Available to withdraw"
        primary={fmtDusdcCompact(vault.available_withdrawal)}
        icon={Unlock}
        iconColor="text-cyan"
        tooltip="DUSDC the vault can pay out right now. Lower than TVL when funds are reserved against open trader positions."
        secondary={
          <span className="text-fg-3">
            {fmtPct(vault.available_withdrawal / Math.max(vault.vault_value, 1), 1)} of TVL
          </span>
        }
      />
    </div>
  )
}

function SecondaryStats({ vault }: { vault: VaultSummary }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
      <Stat
        label="Utilization"
        value={fmtPct(vault.utilization)}
        tooltip="Fraction of vault funds reserved against open trader positions. Higher = more in-flight risk; lower = more idle capital."
      />
      <Stat
        label="Total supplied (lifetime)"
        value={fmtDusdc(vault.total_supplied)}
        tooltip="Cumulative DUSDC ever deposited into the vault since launch. Includes deposits that have since been withdrawn."
      />
      <Stat
        label="Total withdrawn (lifetime)"
        value={fmtDusdc(vault.total_withdrawn)}
        tooltip="Cumulative DUSDC ever withdrawn from the vault since launch."
      />
    </div>
  )
}

function BigStat({
  label, primary, secondary, icon: Icon, iconColor, tooltip,
}: {
  label: string
  primary: string
  secondary: React.ReactNode
  icon: LucideIcon
  iconColor: string
  tooltip?: string
}) {
  return (
    <div className="rounded-lg border border-line/60 bg-surface p-5">
      <div className="flex items-start justify-between">
        <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-fg-3 font-medium">
          {label}
          {tooltip && <InfoTooltip text={tooltip} />}
        </div>
        <Icon className={`h-4 w-4 ${iconColor}`} strokeWidth={1.5} />
      </div>
      <div className="mt-2 text-3xl font-mono font-semibold text-fg">{primary}</div>
      <div className="mt-1 text-xs">{secondary}</div>
    </div>
  )
}

function Stat({ label, value, tooltip }: { label: string; value: string; tooltip?: string }) {
  return (
    <div className="rounded-lg border border-line/60 bg-surface p-4">
      <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-fg-3 font-medium">
        {label}
        {tooltip && <InfoTooltip text={tooltip} />}
      </div>
      <div className="mt-1.5 text-xl font-mono text-fg">{value}</div>
    </div>
  )
}

function YourPosition({ vault }: { vault: VaultSummary }) {
  const account = useCurrentAccount()
  const { data: plp, isLoading } = useWalletPlpCoins()

  const header = (
    <div className="flex items-baseline justify-between mb-3">
      <div className="text-[10px] uppercase tracking-wider text-fg-3 font-semibold">Your position</div>
      {account && plp.totalBalance > 0n && (
        <div className="text-[10px] text-fg-3">
          {plp.coins.length} PLP coin{plp.coins.length === 1 ? '' : 's'}
        </div>
      )}
    </div>
  )

  if (!account) {
    return (
      <div className="rounded-lg border border-line/60 bg-surface p-5">
        {header}
        <div className="text-sm text-fg-3">Connect a wallet to see your LP position.</div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-line/60 bg-surface p-5">
        {header}
        <div className="text-sm text-fg-3">Loading your balance…</div>
      </div>
    )
  }

  const plpBalance = Number(plp.totalBalance) / 1e6
  const positionValueRaw6 = plpBalance * vault.plp_share_price * 1e6
  const totalSupply = vault.plp_total_supply / 1e6
  const shareOfVault = totalSupply > 0 ? plpBalance / totalSupply : 0

  if (plp.totalBalance === 0n) {
    return (
      <div className="rounded-lg border border-line/60 bg-surface p-5">
        {header}
        <div className="text-sm text-fg-3">No PLP shares yet. Supply DUSDC below to start earning.</div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-line/60 bg-surface p-5">
      {header}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PositionStat
          label="PLP balance"
          value={plpBalance.toFixed(4)}
          unit="PLP"
          tooltip="Number of PLP shares you hold. Receive these when you supply DUSDC; burn them to withdraw."
        />
        <PositionStat
          label="Position value"
          value={fmtDusdc(positionValueRaw6)}
          tooltip="Your PLP balance × current share price. Updates automatically as the vault earns."
        />
        <PositionStat
          label="Share of vault"
          value={fmtPct(shareOfVault, 4)}
          tooltip="Your PLP balance as a fraction of all PLP outstanding. Your slice of the vault's yield is proportional to this."
        />
      </div>
    </div>
  )
}

function PositionStat({ label, value, unit, tooltip }: { label: string; value: string; unit?: string; tooltip?: string }) {
  return (
    <div>
      <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-fg-3 font-medium">
        {label}
        {tooltip && <InfoTooltip text={tooltip} />}
      </div>
      <div className="mt-1 text-xl font-mono text-fg">
        {value}
        {unit && <span className="ml-1 text-xs text-fg-3 font-sans">{unit}</span>}
      </div>
    </div>
  )
}
