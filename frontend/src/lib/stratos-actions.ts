import { Transaction } from '@mysten/sui/transactions'
import type { Strategy } from './strategy-types'
import {
  STRATOS_PACKAGE_ID,
  PREDICT_OBJECT_ID,
  QUOTE_ASSET_TYPE,
} from '../config/constants'
import { buildMintStrategyTx } from './predict-actions'

const CLOCK_OBJECT_ID = '0x6'

type TwoLegArgs = {
  managerId: string
  oracleId: string
  expiry: number
  strikeARaw: number
  strikeBRaw: number
  qtyRaw: number
}

// Generic helper as every template has the same shape: 7 args + Quote type param
function buildExecutorCall(fn: string, args: TwoLegArgs): Transaction {
  const tx = new Transaction()
  tx.moveCall({
    target: `${STRATOS_PACKAGE_ID}::executor::${fn}`,
    typeArguments: [QUOTE_ASSET_TYPE],
    arguments: [
      tx.object(PREDICT_OBJECT_ID),
      tx.object(args.managerId),
      tx.object(args.oracleId),
      tx.pure.u64(args.expiry),
      tx.pure.u64(args.strikeARaw),
      tx.pure.u64(args.strikeBRaw),
      tx.pure.u64(args.qtyRaw),
      tx.object(CLOCK_OBJECT_ID),
    ],
  })
  return tx
}

// Dispatcher - picks the right Move function based on strategy template
// Falls back to raw mint PTB for unknown templates
export function buildExecuteStrategyTx(
  strategy: Strategy,
  managerId: string,
  oracleId: string,
  expiry: number,
): Transaction {
  // Templates assume binary legs only else fall back
  if (strategy.legs.length !== 2 || strategy.legs.some((l) => l.kind !== 'binary')) {
    return buildMintStrategyTx({ managerId, oracleId, expiry, legs: strategy.legs })
  }

  const [leg0, leg1] = strategy.legs as [
    Extract<typeof strategy.legs[0], { kind: 'binary' }>,
    Extract<typeof strategy.legs[0], { kind: 'binary' }>,
  ]
  const qtyRaw = Math.round(leg0.qty * 1e6)
  const s0Raw = Math.round(leg0.strike * 1e9)
  const s1Raw = Math.round(leg1.strike * 1e9)
  const common = { managerId, oracleId, expiry, qtyRaw }

  switch (strategy.templateId) {
    case 'bull_ladder':
      // Move expects strike1 < strike2, both UP. legs are seeded ascending.
      return buildExecutorCall('execute_bull_ladder', { ...common, strikeARaw: s0Raw, strikeBRaw: s1Raw })
    case 'bear_ladder':
      // Move expects strike1 > strike2, both DOWN. legs are seeded descending.
      return buildExecutorCall('execute_bear_ladder', { ...common, strikeARaw: s0Raw, strikeBRaw: s1Raw })
    case 'strangle':
      // Move expects (strike_up, strike_down). leg0=UP, leg1=DOWN.
      return buildExecutorCall('execute_strangle', { ...common, strikeARaw: s0Raw, strikeBRaw: s1Raw })
    case 'range_bet':
      // Move expects (strike_low, strike_high). leg0=UP@low, leg1=DOWN@high.
      return buildExecutorCall('execute_range_bet', { ...common, strikeARaw: s0Raw, strikeBRaw: s1Raw })
    default:
      return buildMintStrategyTx({ managerId, oracleId, expiry, legs: strategy.legs })
  }
}
