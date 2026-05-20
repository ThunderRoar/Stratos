import type { ClientWithCoreApi } from '@mysten/sui/client'
import { Transaction } from '@mysten/sui/transactions'
import { bcs } from '@mysten/sui/bcs'
import { PREDICT_PACKAGE_ID, PREDICT_OBJECT_ID } from '../config/constants'

const CLOCK_OBJECT_ID = '0x6'

export type BinaryQuoteArgs = {
  oracleId: string
  expiry: number
  strike: number
  isUp: boolean
  quantity: number
}

export type Quote = {
  cost: bigint // raw DUSDC (6 decimals): mint cost
  payout: bigint // raw DUSDC: redeem payout
}

export async function quoteBinary(client: ClientWithCoreApi, args: BinaryQuoteArgs): Promise<Quote> {
  const tx = new Transaction()
  // simulateTransaction requires a sender
  tx.setSender('0x0000000000000000000000000000000000000000000000000000000000000000')

  // MarketKey
  const key = tx.moveCall({
    target: `${PREDICT_PACKAGE_ID}::market_key::${args.isUp ? 'up' : 'down'}`,
    arguments: [
      tx.pure.id(args.oracleId),
      tx.pure.u64(args.expiry),
      tx.pure.u64(args.strike),
    ],
  })

  // Pass it to get_trade_amounts
  tx.moveCall({
    target: `${PREDICT_PACKAGE_ID}::predict::get_trade_amounts`,
    arguments: [
      tx.object(PREDICT_OBJECT_ID),
      tx.object(args.oracleId),
      key,
      tx.pure.u64(args.quantity),
      tx.object(CLOCK_OBJECT_ID),
    ]
  })

  const result = await client.core.simulateTransaction({
    transaction: tx,
    include: { commandResults: true, effects: true }
  })

  if (result.$kind === 'FailedTransaction') {
    const status = result.FailedTransaction.effects?.status
    throw new Error(`Simulation failed: ${JSON.stringify(status)}`)
  }

  const lastCommand = result.commandResults?.at(-1)
  const returnValues = lastCommand?.returnValues
  if (!returnValues || returnValues.length < 2) {
    throw new Error(`Bad simulation response: missing return values`)
  }

  const cost = bcs.u64().parse(returnValues[0].bcs)
  const payout = bcs.u64().parse(returnValues[1].bcs)

  return { cost: BigInt(cost), payout: BigInt(payout) }
}
