import { useQuery } from '@tanstack/react-query'
import { useCurrentAccount, useCurrentClient } from '@mysten/dapp-kit-react'
import { QUOTE_ASSET_TYPE } from '../config/constants'

export type WalletDusdc = {
  totalBalance: bigint
  coins: { id: string; balance: bigint }[] // starting by largest coin
}

export function useWalletDusdcCoins() {
  const account = useCurrentAccount()
  const client = useCurrentClient()

  const query = useQuery({
    queryKey: ['wallet-dusdc', account?.address],
    queryFn: async (): Promise<WalletDusdc> => {
      if (!account) throw new Error('no account')

      // Fetch in parallel so total balance (1 RPC call) + coin list (1 RPC call)
      const [balanceRes, coinsRes] = await Promise.all([
        client.core.getBalance({
          owner: account.address,
          coinType: QUOTE_ASSET_TYPE,
        }),
        client.core.listCoins({
          owner: account.address,
          coinType: QUOTE_ASSET_TYPE,
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
