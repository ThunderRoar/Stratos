import type { Strategy } from '../lib/strategy-types'
import { useCurrentAccount } from '@mysten/dapp-kit-react'
import { usePredictManager } from '../hooks/usePredictManager'
import { useExecuteStrategy } from '../hooks/useExecuteStrategy'
import { buildCreateManagerTx, buildMintStrategyTx } from '../lib/predict-actions'

type Props = {
  strategy: Strategy | null
  oracleId: string | null
  expiry: number | null
}

export function ExecuteFlow({ strategy, oracleId, expiry }: Props) {
  const account = useCurrentAccount()
  const { managerId, isLoading: mgrLoading, refetch: refetchManager } = usePredictManager()
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

  if (!strategy || !oracleId || expiry == null) {
    return <Hint>Pick a template to enable execution.</Hint>
  }

  const txDigest =
    execute.data?.$kind === 'Transaction' ? execute.data.Transaction.digest : null

  return (
    <Action
      label="Execute Strategy"
      onClick={() => execute.mutateAsync(buildMintStrategyTx({
        managerId,
        oracleId,
        expiry,
        legs: strategy.legs,
      }))}
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
