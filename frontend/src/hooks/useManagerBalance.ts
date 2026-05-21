import { useQuery } from '@tanstack/react-query'
import { useCurrentClient } from '@mysten/dapp-kit-react'
import { Transaction } from '@mysten/sui/transactions'
import { bcs } from '@mysten/sui/bcs'
import { PREDICT_PACKAGE_ID, QUOTE_ASSET_TYPE } from '../config/constants'

export function useManagerBalance(managerId: string | null) {
  const client = useCurrentClient()

  const query = useQuery({
    queryKey: ['manager-balance', managerId],
    queryFn: async (): Promise<bigint> => {
      if (!managerId) throw new Error('no manager')

      const tx = new Transaction()
      tx.setSender('0x0000000000000000000000000000000000000000000000000000000000000000')
      tx.moveCall({
        target: `${PREDICT_PACKAGE_ID}::predict_manager::balance`,
        typeArguments: [QUOTE_ASSET_TYPE],
        arguments: [tx.object(managerId)],
      })

      const result = await client.core.simulateTransaction({
        transaction: tx,
        include: { commandResults: true, effects: true },
      })
      if (result.$kind === 'FailedTransaction') {
        throw new Error(`balance() failed: ${JSON.stringify(result.FailedTransaction.effects?.status)}`)
      }

      const returnValues = result.commandResults?.at(-1)?.returnValues
      if (!returnValues?.[0]) throw new Error('no return value from balance()')
      return BigInt(bcs.u64().parse(returnValues[0].bcs))
    },
    enabled: !!managerId,
    staleTime: 15_000,
  })

  return {
    balance: query.data ?? 0n,
    isLoading: query.isLoading,
    refetch: query.refetch
  }
}
