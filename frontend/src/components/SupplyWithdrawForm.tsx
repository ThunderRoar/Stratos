import { useState } from 'react'
import { useCurrentAccount } from '@mysten/dapp-kit-react'
import { useQueryClient } from '@tanstack/react-query'
import { useExecuteStrategy } from '../hooks/useExecuteStrategy'
import { useWalletDusdcCoins } from '../hooks/useWalletDusdcCoins'
import { useWalletPlpCoins } from '../hooks/useWalletPlpCoins'
import { buildSupplyTx, buildWithdrawTx } from '../lib/predict-actions'
import { translateError } from '../lib/error-translate'
import { explorerTxUrl } from '../lib/explorer'
import type { VaultSummary } from '../lib/predict-types'

type Mode = 'supply' | 'withdraw'

const fmtDusdc = (raw6: bigint | number) => {
  const n = typeof raw6 === 'bigint' ? Number(raw6) : raw6
  return (n / 1e6).toLocaleString('en-US', { maximumFractionDigits: 2 })
}

const fmtPlp = (raw6: bigint | number) => {
  const n = typeof raw6 === 'bigint' ? Number(raw6) : raw6
  return (n / 1e6).toLocaleString('en-US', { maximumFractionDigits: 4 })
}

function toRaw6(input: string): bigint | null {
  const parsed = parseFloat(input)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return BigInt(Math.floor(parsed * 1e6))
}

export function SupplyWithdrawForm({ vault }: { vault: VaultSummary }) {
  const account = useCurrentAccount()
  const [mode, setMode] = useState<Mode>('supply')
  const [amount, setAmount] = useState('')
  const [submitSnapshot, setSubmitSnapshot] = useState<{ dusdc: bigint; plp: bigint; mode: Mode } | null>(null)
  const exec = useExecuteStrategy()
  const queryClient = useQueryClient()
  const { data: dusdc } = useWalletDusdcCoins()
  const { data: plp } = useWalletPlpCoins()

  if (!account) {
    return (
      <div className="rounded-lg border border-line/60 bg-surface p-5">
        <PanelHeader mode={mode} setMode={setMode} />
        <div className="mt-6 text-sm text-fg-3">
          Connect a wallet to supply or withdraw.
        </div>
      </div>
    )
  }

  const walletBalance = mode === 'supply' ? dusdc.totalBalance : plp.totalBalance
  const inputUnit = mode === 'supply' ? 'DUSDC' : 'PLP'
  const outputUnit = mode === 'supply' ? 'PLP' : 'DUSDC'

  const amountRaw = toRaw6(amount)
  const overBalance = amountRaw !== null && amountRaw > walletBalance

  let previewOutput = 0
  let overAvailable = false
  if (amountRaw !== null && amountRaw > 0n) {
    const amtUnits = Number(amountRaw) / 1e6
    if (mode === 'supply') {
      const totalSupplyUnits = vault.plp_total_supply / 1e6
      const vaultValueUnits = vault.vault_value / 1e6
      previewOutput = totalSupplyUnits === 0 || vaultValueUnits === 0
        ? amtUnits
        : (amtUnits * totalSupplyUnits) / vaultValueUnits
    } else {
      previewOutput = amtUnits * vault.plp_share_price
      const previewRaw6 = previewOutput * 1e6
      overAvailable = previewRaw6 > vault.available_withdrawal
    }
  }

  const validationError =
    amountRaw === null && amount.length > 0
      ? 'Enter a positive number'
      : overBalance
        ? `Insufficient ${inputUnit} in wallet`
        : overAvailable
          ? `Exceeds available withdrawal (${fmtDusdc(vault.available_withdrawal)} DUSDC)`
          : null

  const canSubmit =
    amountRaw !== null && amountRaw > 0n && !overBalance && !overAvailable && !exec.isPending

  const handleMax = () => {
    setAmount((Number(walletBalance) / 1e6).toString())
  }

  const handleSubmit = async () => {
    if (!canSubmit || !amountRaw) return

    // Snapshot before the tx so we can detect chain success via balance diff after the mutation
    setSubmitSnapshot({ dusdc: dusdc.totalBalance, plp: plp.totalBalance, mode })

    const tx = mode === 'supply'
      ? buildSupplyTx({
          amountRaw,
          sourceCoinId: dusdc.coins[0].id,
          sender: account.address,
        })
      : buildWithdrawTx({
          sharesRaw: amountRaw,
          sourcePlpCoinId: plp.coins[0].id,
          sender: account.address,
        })

    try {
      await exec.mutateAsync(tx)
      setAmount('')
    } catch {
      // exec.error is rendered below
    } finally {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['vault'] }),
        queryClient.invalidateQueries({ queryKey: ['wallet-dusdc'] }),
        queryClient.invalidateQueries({ queryKey: ['wallet-plp'] }),
      ])
    }
  }

  const txResult =
    exec.data?.$kind === 'Transaction' ? exec.data.Transaction : exec.data?.FailedTransaction
  const successDigest = txResult?.digest ?? null
  const successUrl = successDigest ? explorerTxUrl(successDigest) : null
  const balanceConfirmsSuccess = submitSnapshot != null && (
    submitSnapshot.mode === 'supply'
      ? dusdc.totalBalance < submitSnapshot.dusdc
      : plp.totalBalance < submitSnapshot.plp
  )
  const showError = !!exec.error && !balanceConfirmsSuccess
  const showSuccess = !exec.isPending && (!!successUrl || balanceConfirmsSuccess)

  return (
    <div className="rounded-lg border border-line/60 bg-surface p-5">
      <PanelHeader mode={mode} setMode={setMode} />

      <div className="mt-5 flex items-baseline justify-between text-xs">
        <span className="text-fg-3">
          Wallet: <span className="font-mono text-fg-2">
            {mode === 'supply' ? fmtDusdc(walletBalance) : fmtPlp(walletBalance)} {inputUnit}
          </span>
        </span>
        <button
          type="button"
          onClick={handleMax}
          className="text-accent hover:text-accent/80 text-xs font-medium"
        >
          Max
        </button>
      </div>

      <div className="mt-2 flex items-center gap-3 overflow-hidden rounded-lg border border-line bg-surface-elev focus-within:border-accent transition p-4">
        <input
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{
            flex: '1 1 0%',
            minWidth: 0,
            border: 'none',
            outline: 'none',
            boxShadow: 'none',
            background: 'transparent',
            appearance: 'none',
          }}
          className="text-right text-lg font-mono text-fg placeholder:text-fg-3"
        />
        <span className="shrink-0 text-xs text-fg-3 font-medium select-none">
          {inputUnit}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-fg-3">
        <span>You'll receive ~</span>
        <span className="font-mono text-fg-2">
          {previewOutput > 0
            ? `${previewOutput.toLocaleString('en-US', { maximumFractionDigits: 4 })} ${outputUnit}`
            : `— ${outputUnit}`}
        </span>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="mt-5 w-full rounded-full bg-accent hover:bg-accent/90 disabled:bg-line disabled:text-fg-3 px-4 py-3 text-sm font-semibold text-bg transition"
      >
        {exec.isPending
          ? mode === 'supply' ? 'Supplying…' : 'Withdrawing…'
          : mode === 'supply' ? 'Supply DUSDC' : 'Withdraw PLP'}
      </button>


      {validationError && amount.length > 0 && (
        <div className="mt-3 text-xs text-warn">{validationError}</div>
      )}
      {showError && (
        <div className="mt-3 text-xs text-loss">
          Transaction failed: {translateError(exec.error!.message)}
        </div>
      )}
      {showSuccess && (
        <div className="mt-3 text-xs text-profit">
          ✓ Confirmed.{successUrl && (
            <> <a href={successUrl} target="_blank" rel="noopener noreferrer" className="underline">
              View on explorer
            </a></>
          )}
        </div>
      )}
    </div>
  )
}

function PanelHeader({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-[10px] uppercase tracking-wider text-fg-3 font-semibold">
        {mode === 'supply' ? 'Supply' : 'Withdraw'}
      </div>
      <div className="inline-flex rounded-full bg-surface-elev p-0.5 text-xs">
        <button
          type="button"
          onClick={() => setMode('supply')}
          className={`rounded-full px-3 py-1 transition ${
            mode === 'supply' ? 'bg-accent text-bg font-medium' : 'text-fg-3 hover:text-fg'
          }`}
        >
          Supply
        </button>
        <button
          type="button"
          onClick={() => setMode('withdraw')}
          className={`rounded-full px-3 py-1 transition ${
            mode === 'withdraw' ? 'bg-accent text-bg font-medium' : 'text-fg-3 hover:text-fg'
          }`}
        >
          Withdraw
        </button>
      </div>
    </div>
  )
}
