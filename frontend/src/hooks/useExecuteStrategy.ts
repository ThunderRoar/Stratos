import { useMutation } from '@tanstack/react-query'
import { useDAppKit } from '@mysten/dapp-kit-react'
import type { Transaction } from '@mysten/sui/transactions'

export function useExecuteStrategy() {
  const dappKit = useDAppKit()

  return useMutation({
    mutationFn: async (tx: Transaction) => {
      const result = await dappKit.signAndExecuteTransaction({ transaction: tx })
      return result
    }
  })
}
