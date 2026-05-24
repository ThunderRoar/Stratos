import type { OraclePrice, OracleSVI, OracleSnapshot } from './predict-types'

// ASOF join: For each price event, find the most recent SVI event at or before
// its timestamp. Both inputs come from the Predict server in newest-first order. 
// We sort ascending then walk both arrays simultaneously with two pointers.
export function joinPricesAndSvi(prices: OraclePrice[], sviHistory: OracleSVI[]): OracleSnapshot[] {
  const asc = (a: { checkpoint_timestamp_ms: number }, b: { checkpoint_timestamp_ms: number }) =>
    a.checkpoint_timestamp_ms - b.checkpoint_timestamp_ms

  const sortedPrices = [...prices].sort(asc)
  const sortedSvi = [...sviHistory].sort(asc)

  if (sortedPrices.length === 0 || sortedSvi.length === 0) return []

  const out: OracleSnapshot[] = []
  let sviIdx = 0

  for (const p of sortedPrices) {
    // Advance the SVI pointer while the NEXT svi is still <= this price's time
    // After the loop, sortedSvi[sviIdx] is the most recent svi at or before p
    while (sviIdx + 1 < sortedSvi.length && sortedSvi[sviIdx + 1].checkpoint_timestamp_ms <= p.checkpoint_timestamp_ms) {
      sviIdx++
    }
    // Skip prices that occur before we have any SVI data at all
    if (sortedSvi[sviIdx].checkpoint_timestamp_ms > p.checkpoint_timestamp_ms) continue

    out.push({
      timestampMs: p.checkpoint_timestamp_ms,
      spot: p.spot,
      forward: p.forward,
      svi: sortedSvi[sviIdx]
    })
  }
  return out
}

// Downsample evenly across the time range to ~targetCount rows
export function downsample<T>(rows: T[], targetCount: number): T[] {
  if (rows.length <= targetCount) return rows
  const step = rows.length / targetCount
  const out: T[] = []
  for (let i = 0; i < targetCount; i++) {
    out.push(rows[Math.floor(i * step)])
  }
  // Always keep the last point so correct ending point
  if (out[out.length - 1] !== rows[rows.length - 1]) {
    out.push(rows[rows.length - 1])
  }
  return out
}

// Filter to a specific time window. Used to scope a backtest without having to refetch
export function withinWindow<T extends { timestampMs: number }>(rows: T[], fromMs: number, toMs: number = Date.now()): T[] {
  return rows.filter((r) => r.timestampMs >= fromMs && r.timestampMs <= toMs)
}
