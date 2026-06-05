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

// Adds N x mint() calls into a single PTB and assumes the manager has sufficient DUSDC already deposited
export function buildMintStrategyTx(args: MintStrategyArgs): Transaction {
  const tx = new Transaction()

  for (const leg of args.legs) {
    if (leg.kind === 'binary') {
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
    } else {
      // Range leg uses Predict's native mint_range pays qty when settlement in (lower, higher], priced as a single instrument via the vertical range primitive
      const key = tx.moveCall({
        target: `${PREDICT_PACKAGE_ID}::range_key::new`,
        arguments: [
          tx.pure.id(args.oracleId),
          tx.pure.u64(args.expiry),
          tx.pure.u64(Math.round(leg.lower * 1e9)),
          tx.pure.u64(Math.round(leg.higher * 1e9)),
        ],
      })
      tx.moveCall({
        target: `${PREDICT_PACKAGE_ID}::predict::mint_range`,
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
  }

  return tx
}

export type RedeemPositionArgs = {
  managerId: string
  oracleId: string
  expiry: number // raw ms timestamp
  strike: number // raw 9 decimal
  isUp: boolean
  qtyRaw: number
}

// Closes a single binary position
export function buildRedeemPositionTx(args: RedeemPositionArgs): Transaction {
  const tx = new Transaction()

  const key = tx.moveCall({
    target: `${PREDICT_PACKAGE_ID}::market_key::${args.isUp ? 'up' : 'down'}`,
    arguments: [
      tx.pure.id(args.oracleId),
      tx.pure.u64(args.expiry),
      tx.pure.u64(args.strike),
    ],
  })

  tx.moveCall({
    target: `${PREDICT_PACKAGE_ID}::predict::redeem`,
    typeArguments: [QUOTE_ASSET_TYPE],
    arguments: [
      tx.object(PREDICT_OBJECT_ID),
      tx.object(args.managerId),
      tx.object(args.oracleId),
      key,
      tx.pure.u64(args.qtyRaw),
      tx.object(CLOCK_OBJECT_ID),
    ],
  })
  return tx
}

export type DepositArgs = {
  managerId: string
  amountRaw: bigint // raw 6 decimal DUSDC
  sourceCoinId: string // a wallet coin with balance >= amountRaw
}

export function buildDepositTx(args: DepositArgs): Transaction {
  const tx = new Transaction()

  const [splitCoin] = tx.splitCoins(
    tx.object(args.sourceCoinId),
    [tx.pure.u64(args.amountRaw)],
  )

  tx.moveCall({
    target: `${PREDICT_PACKAGE_ID}::predict_manager::deposit`,
    typeArguments: [QUOTE_ASSET_TYPE],
    arguments: [
      tx.object(args.managerId),
      splitCoin,
    ],
  })
  return tx
}

// LP deposit: split the requested DUSDC out of the user's coin, hand it to predict::supply, receive PLP shares back, and send them to the user's address.
// Note: unlike trading, LPs interact with Predict directly
export type SupplyArgs = {
  amountRaw: bigint
  sourceCoinId: string // a wallet DUSDC coin with balance >= amountRaw
  sender: string
}

export function buildSupplyTx(args: SupplyArgs): Transaction {
  const tx = new Transaction()

  const [splitCoin] = tx.splitCoins(
    tx.object(args.sourceCoinId),
    [tx.pure.u64(args.amountRaw)],
  )

  const plpCoin = tx.moveCall({
    target: `${PREDICT_PACKAGE_ID}::predict::supply`,
    typeArguments: [QUOTE_ASSET_TYPE],
    arguments: [
      tx.object(PREDICT_OBJECT_ID),
      splitCoin,
      tx.object(CLOCK_OBJECT_ID),
    ],
  })

  tx.transferObjects([plpCoin], tx.pure.address(args.sender))
  return tx
}

// LP withdrawal: split the requested PLP out of the user's coin, hand it to predict::withdraw, receive DUSDC back, and send it to the user's address. The vault burns the PLP internally.
export type WithdrawArgs = {
  sharesRaw: bigint
  sourcePlpCoinId: string
  sender: string
}

export function buildWithdrawTx(args: WithdrawArgs): Transaction {
  const tx = new Transaction()

  const [splitPlp] = tx.splitCoins(
    tx.object(args.sourcePlpCoinId),
    [tx.pure.u64(args.sharesRaw)],
  )

  const dusdcCoin = tx.moveCall({
    target: `${PREDICT_PACKAGE_ID}::predict::withdraw`,
    typeArguments: [QUOTE_ASSET_TYPE],
    arguments: [
      tx.object(PREDICT_OBJECT_ID),
      splitPlp,
      tx.object(CLOCK_OBJECT_ID),
    ],
  })

  tx.transferObjects([dusdcCoin], tx.pure.address(args.sender))
  return tx
}


