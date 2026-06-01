export type OracleStatus = 'inactive' | 'active' | 'pending_settlement' | 'settled';

export type Oracle = {
  predict_id: string
  oracle_id: string
  oracle_cap_id: string
  underlying_asset: string
  expiry: number
  min_strike: number
  tick_size: number
  status: OracleStatus
  activated_at: number
  settlement_price: number | null
  settled_at: number | null
  created_checkpoint: number
}

export type OraclePrice = {
  oracle_id: string
  checkpoint: number
  checkpoint_timestamp_ms: number
  spot: number
  forward: number
  onchain_timestamp: number
}

export type OracleSVI = {
  oracle_id: string
  a: number
  b: number
  rho: number
  rho_negative: boolean
  m: number
  m_negative: boolean
  sigma: number
  checkpoint_timestamp_ms: number
}

export type OracleState = {
  oracle: Oracle
  latest_price: OraclePrice | null
  latest_svi: OracleSVI | null
  ask_bounds: unknown | null
}

export type Position = {
  oracle_id: string
  underlying_asset: string
  expiry: number
  strike: number
  is_up: boolean
  open_quantity: number
  open_cost_basis: number
  mark_value: number
  unrealized_pnl: number
  realized_pnl: number
  status: 'active' | 'settled' | 'pending_settlement'
  first_minted_at: number
  last_activity_at: number
}

// For backtesting where each row has SVI and price at a given timestamp
export type OracleSnapshot = {
  timestampMs: number
  spot: number
  forward: number
  svi: OracleSVI
}

// Snapshot of Predict's liquidity vault
// utilization and max_payout_utilization are fractions in [0, 1]
export type VaultSummary = {
  predict_id: string
  quote_assets: string[]
  vault_balance: number // total DUSDC sitting in the pool
  vault_value: number // vault_balance + mark to market on open exposure
  total_mtm: number // current MTM of open positions vault is short
  total_max_payout: number // worst-case payout if every position settles ITM
  available_liquidity: number // DUSDC the vault could pay out right now
  available_withdrawal: number  // DUSDC LPs are allowed to withdraw right now
  plp_total_supply: number // total PLP shares outstanding
  plp_share_price: number // DUSDC per share (NAV)
  utilization: number // fraction of vault tied up in open exposure
  max_payout_utilization: number // fraction tied up under worst-case settlement
  net_deposits: number // total_supplied - total_withdrawn
  total_supplied: number  // lifetime DUSDC deposited
  total_withdrawn: number // lifetime DUSDC withdrawn
}

// One sample of vault NAV over time
export type VaultPerformancePoint = {
  timestamp_ms: number
  share_price: number
  vault_value: number
  total_shares: number
}

export type VaultPerformance = {
  predict_id: string
  range: string
  points: VaultPerformancePoint[]
}
