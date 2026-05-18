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
