import { useState } from 'react'
import type { Strategy } from '../lib/strategy-types'
import { useCurrentAccount } from '@mysten/dapp-kit-react'
import { usePredictManager } from '../hooks/usePredictManager'
import { useManagerBalance } from '../hooks/useManagerBalance'
import { useWalletDusdcCoins } from '../hooks/useWalletDusdcCoins'
import { useExecuteStrategy } from '../hooks/useExecuteStrategy'
import { buildCreateManagerTx, buildDepositTx } from '../lib/predict-actions'
import { buildExecuteStrategyTx } from '../lib/stratos-actions'
import { translateError } from '../lib/error-translate'
import { explorerTxUrl } from '../lib/explorer'

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
  const [syncing, setSyncing] = useState(false)

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
        pendingLabel={syncing ? 'Waiting for indexer…' : undefined}
        onClick={async () => {
          try {
            await execute.mutateAsync(buildCreateManagerTx())
          } catch {
            // Wallet-closed quirk: tx may have succeeded. The poll below detects via manager existence.
          }
          setSyncing(true)
          try {
            // Predict server indexer lags the chain by 10-30s so poll until our manager shows up
            const deadline = Date.now() + 45_000
            while (Date.now() < deadline) {
              const { data } = await refetchManager()
              if (data) {
                // Manager exists on chain — clear any stale dapp-kit error so the cascade advances
                if (execute.error) execute.reset()
                break
              }
              await new Promise((r) => setTimeout(r, 1500))
            }
          } finally {
            setSyncing(false)
          }
        }}
        pending={execute.isPending || syncing}
        error={translateError(execute.error?.message)}
      />
    )
  }

  // Total cost of the strategy = sum of leg costs in raw DUSDC. Quoted legs carry cost in dollars via Builder's /1e6 conversion, multiply back to raw for the manager balance check
  const strategyCostRaw =
    strategy?.legs.reduce((sum, l) => sum + BigInt(Math.round(l.cost * 1e6)), 0n) ?? 0n

  // Predict re-prices each leg at mint time, so the quoted cost is only a snapshot. Without a
  // buffer, even 1 unit of theta drift between deposit and execute aborts mint with code 3 in
  // balance_manager::withdraw_with_proof. 2% absorbs typical drift over a signing window
  const depositTargetRaw = strategyCostRaw + strategyCostRaw / 50n
  const shortfallRaw = depositTargetRaw - mgrBalance
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
          Manager balance: {fmtUsd(mgrBalance)} · Strategy cost: {fmtUsd(strategyCostRaw)} (depositing 2% buffer)
        </div>
        <Action
          label={`Deposit ${fmtUsd(shortfallRaw)}`}
          pendingLabel={syncing ? 'Confirming on chain…' : undefined}
          onClick={async () => {
            try {
              await execute.mutateAsync(buildDepositTx({
                managerId,
                amountRaw: shortfallRaw,
                sourceCoinId: wallet.coins[0].id,
              }))
            } catch {
              // Wallet-closed quirk possible - chain may have succeeded anyway. Poll below decides.
            }
            setSyncing(true)
            try {
              // Always poll: if balance reaches target, deposit succeeded regardless of any error
              const deadline = Date.now() + 20_000
              while (Date.now() < deadline) {
                const [{ data: bal }] = await Promise.all([refetchManagerBalance(), refetchWallet()])
                if (bal != null && bal >= depositTargetRaw) {
                  // Chain confirms success - clear any stale dapp-kit error so the cascade advances
                  if (execute.error) execute.reset()
                  break
                }
                await new Promise((r) => setTimeout(r, 1000))
              }
            } finally {
              setSyncing(false)
            }
          }}
          pending={execute.isPending || syncing}
          error={translateError(execute.error?.message)}
        />
      </div>
    )
  }

  if (!strategy || !oracleId || expiry == null) {
    return <Hint>Pick a template to enable execution.</Hint>
  }

  // Pull the digest from either kind - dapp kit's local effects parser can mislabel a
  // chain-successful tx as FailedTransaction when its BCS types lag the network, but the
  // digest itself is always valid and clickable on Suiscan
  const txResult =
    execute.data?.$kind === 'Transaction'
      ? execute.data.Transaction
      : execute.data?.FailedTransaction
  const txDigest = txResult?.digest ?? null

  return (
    <div className="space-y-2">
      <div className="text-xs text-zinc-500">
        Manager balance: {fmtUsd(mgrBalance)} · Strategy cost: {fmtUsd(strategyCostRaw)} (covered)
      </div>
      <Action
        label="Execute Strategy"
        pendingLabel={syncing ? 'Confirming on chain…' : 'Executing on chain…'}
        onClick={async () => {
          // Snapshot manager balance pre-execute. A successful mint drops it by ~strategyCostRaw,
          // letting us detect chain success even if dapp kit throws the popup-closed quirk.
          const balanceBefore = mgrBalance
          try {
            await execute.mutateAsync(buildExecuteStrategyTx(strategy, managerId, oracleId, expiry))
          } catch {
            // Wallet-closed quirk: tx may have succeeded. The poll below decides.
          }
          setSyncing(true)
          try {
            // Poll until manager balance drops (indicating the mint hit chain) or timeout
            const deadline = Date.now() + 20_000
            while (Date.now() < deadline) {
              const { data: bal } = await refetchManagerBalance()
              if (bal != null && bal < balanceBefore) {
                // Chain confirms success — clear any stale dapp-kit error
                if (execute.error) execute.reset()
                break
              }
              await new Promise((r) => setTimeout(r, 1000))
            }
          } finally {
            setSyncing(false)
          }
        }}
        pending={execute.isPending || syncing}
        error={translateError(execute.error?.message)}
        success={txDigest ? `Tx: ${txDigest.slice(0, 16)}…` : null}
        successHref={txDigest ? explorerTxUrl(txDigest) : null}
      />
    </div>
  )
}

function Hint({ children }: { children: React.ReactNode }) {
  return <div className="text-xs text-zinc-500">{children}</div>
}

function Action({
  label, onClick, pending, pendingLabel, error, success, successHref,
}: { label: string; onClick: () => void; pending: boolean; pendingLabel?: string; error: string | null; success?: string | null; successHref?: string | null }) {
  return (
    <div className="space-y-2">
      <button
        onClick={onClick}
        disabled={pending}
        className="rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 px-4 py-2 text-sm font-semibold"
      >
        {pending ? (pendingLabel ?? 'Signing…') : label}
      </button>
      {error && <div className="text-xs text-red-400">{error}</div>}
      {success && (
        successHref ? (
          <a
            href={successHref}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs text-green-400 hover:text-green-300 underline underline-offset-2"
          >
            {success} ↗
          </a>
        ) : (
          <div className="text-xs text-green-400">{success}</div>
        )
      )}
    </div>
  )
}
