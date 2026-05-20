import { Transaction } from '@mysten/sui/transactions'
import {
  PREDICT_PACKAGE_ID,
  PREDICT_OBJECT_ID,
  QUOTE_ASSET_TYPE,
} from '../config/constants'
import type { Leg } from './strategy-types'

const CLOCK_OBJECT_ID = '0x6'

// One time creation of manager
export function buildCreateManagerTx(): Transaction {
  const tx = new Transaction()
  tx.moveCall({
    target: `${PREDICT_PACKAGE_ID}::predict::create_manager`,
    arguments: [],
  })
  return tx
}

export type MintStrategyArgs = {
  managerId: string
  oracleId: string
  expiry: number
  legs: Leg[]
}

// Adds N x mint() calls into a single PTB and assumes the manager has sufficient DUSDC already deposited.
export function buildMintStrategyTx(args: MintStrategyArgs): Transaction {
  const tx = new Transaction()

  for (const leg of args.legs) {
    if (leg.kind !== 'binary') {
      throw new Error('range legs not implemented in mint PTB yet')
    }

    const key = tx.moveCall({
      target: `${PREDICT_PACKAGE_ID}::market_key::${leg.direction === 'up' ? 'up' : 'down'}`,
      arguments: [
        tx.pure.id(args.oracleId),
        tx.pure.u64(args.expiry),
        tx.pure.u64(Math.round(leg.strike * 1e9)),
      ],
    })

    tx.moveCall({
      target: `${PREDICT_PACKAGE_ID}::predict::mint`,
      typeArguments: [QUOTE_ASSET_TYPE],
      arguments: [
        tx.object(PREDICT_OBJECT_ID),
        tx.object(args.managerId),
        tx.object(args.oracleId),
        key,
        tx.pure.u64(Math.round(leg.qty * 1e6)),
        tx.object(CLOCK_OBJECT_ID),
      ],
    })
  }

  return tx
}
