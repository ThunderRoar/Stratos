import { useQuery } from '@tanstack/react-query'
import { useCurrentAccount, useCurrentClient } from '@mysten/dapp-kit-react'
import { PLP_COIN_TYPE } from '../config/constants'

export type WalletPlp = {
  totalBalance: bigint
  coins: { id: string; balance: bigint }[] // sorted by largest first
}

export function useWalletPlpCoins() {
  const account = useCurrentAccount()
  const client = useCurrentClient()

  const query = useQuery({
    queryKey: ['wallet-plp', account?.address],
    queryFn: async (): Promise<WalletPlp> => {
      if (!account) throw new Error('no account')

      const [balanceRes, coinsRes] = await Promise.all([
        client.core.getBalance({
          owner: account.address,
          coinType: PLP_COIN_TYPE,
        }),
        client.core.listCoins({
          owner: account.address,
          coinType: PLP_COIN_TYPE,
        }),
      ])

      const coins = coinsRes.objects
        .map((c) => ({ id: c.objectId, balance: BigInt(c.balance) }))
        .sort((a, b) => (b.balance > a.balance ? 1 : b.balance < a.balance ? -1 : 0))

      return {
        totalBalance: BigInt(balanceRes.balance.balance),
        coins,
      }
    },
    enabled: !!account,
    staleTime: 15_000,
  })

  return {
    data: query.data ?? { totalBalance: 0n, coins: [] },
    isLoading: query.isLoading,
    refetch: query.refetch,
  }
}
