# Stratos

Multi-leg options strategies on DeepBook Predict. A retail-friendly interface for building, pricing, executing, and providing liquidity for binary options on Sui.

<p align="center">
  <a href="https://www.youtube.com/watch?v=Hs8423Mirds">
    <img src="https://img.youtube.com/vi/Hs8423Mirds/0.jpg" alt="Stratos demo video" width="640">
  </a>
</p>

## Why it matters

DeFi options haven't scaled because retail users can't construct multi-leg strategies without quant expertise. TradFi platforms drove options volume 10x by making complex strategies one click. 

> DeepBook Predict has the on-chain primitives. Stratos provides the interface.

- **Retail-grade composition.** Four binary-native templates (bull/bear ladder, strangle, range bet) with live cost preview, payoff diagrams, Greeks, probability of profit via Monte Carlo, and intraday backtesting - all from on-chain SVI parameters.
- **Sui-native execution.** Our own Move module ([`stratos::executor`](#on-chain)) wraps Predict's mint calls into named, validated, event-emitting strategies. Multi-leg trades execute atomically in one PTB signature - impossible on EVM without a custom contract per shape.
- **Both sides of the protocol.** Strategy builders trade. The **Earn page** lets retail supply DUSDC to Predict's vault and be the counterparty - collapsing LP onboarding into one stat (share price), one action (Supply), one chart (line goes up).


## What's inside

| Feature | What it does |
|---------|-------------|
| **Strategy Builder** | Five templates (bull ladder, bear ladder, strangle, range bet, range band) with live chain-priced cost preview from `get_trade_amounts`. Strikes are draggable and payoff updates in real time. |
| **Risk Panel** | Bloomberg grade Greeks (Delta, Theta, max profit/loss, probability of profit) via Monte Carlo on the live SVI surface. |
| **Volatility Surface** | Live implied volatility smile derived from on-chain oracle SVI parameters - the same model Predict uses to price every trade. |
| **Intraday Backtest** | Replay any strategy against the last 15m-3h of historical SVI snapshots. Same pricing math as Risk Panel, replayed over real history. |
| **Activity Feed** | Live updating table of every `StrategyExecuted` event our Move contract has ever emitted. Single Sui RPC call, no indexer, no backend. |
| **Move Executor** | Our own published Move module on testnet. Per-template entry functions with on-chain shape validation and typed events. |
| **Earn (Vault LP)** | Supply DUSDC to Predict's PLP vault and earn yield from option premiums. Live TVL, share price chart with range toggle and direction-aware coloring, supply/withdraw form. |


## On-chain

| Field | Value |
|-------|-------|
| Network | Sui **Testnet** |
| Stratos Move package | [`0x1353e53419f8c227df2e85817cf8bfbdb08c290d01f5dbdfe44058fb19dcbcfa`](https://suiscan.xyz/testnet/object/0x1353e53419f8c227df2e85817cf8bfbdb08c290d01f5dbdfe44058fb19dcbcfa) |
| Module | `stratos::executor` |
| Functions | `execute_bull_ladder` · `execute_bear_ladder` · `execute_strangle` · `execute_range_bet` · `execute_range_band` |
| LP (Earn) | Calls Predict's `supply` / `withdraw` directly, no wrapper needed. LPs interact with the global vault, not via a per-user manager. |
| Event | `StrategyExecuted` (queryable via `client.queryEvents`) |
| Predict package (third-party) | [`0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138`](https://suiscan.xyz/testnet/object/0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138) |
| Quote asset | DUSDC (Predict testnet's quote token, 6 decimals) |

Source: [`packages/move/sources/executor.move`](packages/move/sources/executor.move)


## Run locally

Prerequisites: Node 22+, a Sui wallet (Slush, Suiet, or Sui Wallet), and some testnet SUI/DUSDC.

```bash
git clone https://github.com/Thunderroar/Stratos.git
cd Stratos/frontend
npm install
npm run dev
```


### Build for production

```bash
npm run build
npm run preview
```


## Next Steps

When Predict goes mainnet, Stratos becomes the structured products layer for binary options on Sui on day one so same code, no migration. Planned extensions:

- Multi-asset support: ETH, SOL, and other oracles as Predict activates them (no code changes required)
- Public on-chain vol index: expose ATM IV, term structure, and the full smile derived from oracle SVI parameters as a primitive other Sui protocols can read. Sui has no native vol oracle product today, so this gives lending, derivatives, and structured products a live source.
- Secondary market: close positions before expiry by transferring entries to other users
- Vault strategies: automated yield strategies on the Earn vault when Predict ships `OperatorCap`


## References

- [Sui Documentation](https://docs.sui.io/)
- [Programmable Transaction Blocks](https://docs.sui.io/concepts/transactions/prog-txn-blocks)
- [Sui TypeScript SDK](https://sdk.mystenlabs.com/typescript)
- [dApp Kit](https://sdk.mystenlabs.com/dapp-kit)
- [DeepBook Predict Documentation](https://docs.sui.io/onchain-finance/deepbook-predict/)
- [Move source](https://github.com/MystenLabs/deepbookv3/tree/predict-testnet-4-16/packages/predict)
