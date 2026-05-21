import type { Strategy } from '../lib/strategy-types'
import { useCurrentAccount } from '@mysten/dapp-kit-react'
import { usePredictManager } from '../hooks/usePredictManager'
import { useManagerBalance } from '../hooks/useManagerBalance'
import { useWalletDusdcCoins } from '../hooks/useWalletDusdcCoins'
import { useExecuteStrategy } from '../hooks/useExecuteStrategy'
import {
  buildCreateManagerTx,
  buildMintStrategyTx,
  buildDepositTx,
} from '../lib/predict-actions'

type Props = {
  strategy: Strategy | null
  oracleId: string | null
  expiry: number | null
}

const fmtUsd = (raw: bigint) =>
  (Number(raw) / 1e6).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  })

export function ExecuteFlow({ strategy, oracleId, expiry }: Props) {
  const account = useCurrentAccount()
  const { managerId, isLoading: mgrLoading, refetch: refetchManager } = usePredictManager()
  const { balance: mgrBalance, refetch: refetchManagerBalance } = useManagerBalance(managerId)
  const { data: wallet, refetch: refetchWallet } = useWalletDusdcCoins()
  const execute = useExecuteStrategy()

  if (!account) {
    return <Hint>Connect a wallet to execute.</Hint>
  }
  if (mgrLoading) {
    return <Hint>Checking for your manager…</Hint>
  }
  if (!managerId) {
    return (
      <Action
        label="Create Manager"
        onClick={async () => {
          await execute.mutateAsync(buildCreateManagerTx())
          await refetchManager()
        }}
        pending={execute.isPending}
        error={execute.error?.message ?? null}
      />
    )
  }

  // Total cost of the strategy = sum of leg costs in raw DUSDC. Quoted legs carry cost in dollars via Builder's /1e6 conversion, multiply back to raw for the manager balance check.
  const strategyCostRaw =
    strategy?.legs.reduce((sum, l) => sum + BigInt(Math.round(l.cost * 1e6)), 0n) ?? 0n

  const shortfallRaw = strategyCostRaw - mgrBalance
  const needsDeposit = strategy != null && shortfallRaw > 0n

  if (needsDeposit) {
    const canCover = (wallet.coins[0]?.balance ?? 0n) >= shortfallRaw
    if (!canCover) {
      return (
        <Hint>
          Need {fmtUsd(shortfallRaw)} more in manager. Your largest wallet coin is{' '}
          {fmtUsd(wallet.coins[0]?.balance ?? 0n)} — request more DUSDC from the faucet.
        </Hint>
      )
    }

    return (
      <div className="space-y-2">
        <div className="text-xs text-zinc-500">
          Manager balance: {fmtUsd(mgrBalance)} · Strategy cost: {fmtUsd(strategyCostRaw)}
        </div>
        <Action
          label={`Deposit ${fmtUsd(shortfallRaw)}`}
          onClick={async () => {
            await execute.mutateAsync(buildDepositTx({
              managerId,
              amountRaw: shortfallRaw,
              sourceCoinId: wallet.coins[0].id,
            }))
            await Promise.all([refetchManagerBalance(), refetchWallet()])
          }}
          pending={execute.isPending}
          error={execute.error?.message ?? null}
        />
      </div>
    )
  }

  if (!strategy || !oracleId || expiry == null) {
    return <Hint>Pick a template to enable execution.</Hint>
  }

  const txDigest =
    execute.data?.$kind === 'Transaction' ? execute.data.Transaction.digest : null

  return (
    <Action
      label="Execute Strategy"
      onClick={async () => {
        await execute.mutateAsync(buildMintStrategyTx({
          managerId,
          oracleId,
          expiry,
          legs: strategy.legs,
        }))
        // Manager balance drops after mint so refetch so the UI is current.
        await refetchManagerBalance()
      }}
      pending={execute.isPending}
      error={execute.error?.message ?? null}
      success={txDigest ? `Tx: ${txDigest.slice(0, 16)}…` : null}
    />
  )
}

function Hint({ children }: { children: React.ReactNode }) {
  return <div className="text-xs text-zinc-500">{children}</div>
}

function Action({
  label, onClick, pending, error, success,
}: { label: string; onClick: () => void; pending: boolean; error: string | null; success?: string | null }) {
  return (
    <div className="space-y-2">
      <button
        onClick={onClick}
        disabled={pending}
        className="rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 px-4 py-2 text-sm font-semibold"
      >
        {pending ? 'Signing…' : label}
      </button>
      {error && <div className="text-xs text-red-400">{error}</div>}
      {success && <div className="text-xs text-green-400">{success}</div>}
    </div>
  )
}
