import { PREDICT_SERVER_URL, PREDICT_OBJECT_ID } from '../config/constants'
import type { Oracle, OracleState, Position, OraclePrice, OracleSVI } from './predict-types'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${PREDICT_SERVER_URL}${path}`)
  if (!res.ok) {
    throw new Error(`Predict server ${res.status}: ${path}`)
  }
  return res.json() as Promise<T>
}

export function getOracles(predictId: string = PREDICT_OBJECT_ID) {
  return get<Oracle[]>(`/predicts/${predictId}/oracles`)
}

export function getOracleState(oracleId: string) {
  return get<OracleState>(`/oracles/${oracleId}/state`)
}

export type ManagerSummary = {
  manager_id: string
  owner: string
  checkpoint_timestamp_ms: number
}

export async function getManagersByOwner(owner: string): Promise<ManagerSummary[]> {
  const all = await get<ManagerSummary[]>('/managers')
  return all.filter((m) => m.owner.toLowerCase() === owner.toLowerCase())
}

export function getPositions(managerId: string) {
  return get<Position[]>(`/managers/${managerId}/positions/summary`)
}

export function getOraclePriceHistory(oracleId: string, limit = 1000) {
  return get<OraclePrice[]>(`/oracles/${oracleId}/prices?limit=${limit}`)
}

export function getOracleSviHistory(oracleId: string, limit = 1000) {
  return get<OracleSVI[]>(`/oracles/${oracleId}/svi?limit=${limit}`)
}

