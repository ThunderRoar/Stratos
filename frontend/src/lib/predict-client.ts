import { PREDICT_SERVER_URL, PREDICT_OBJECT_ID } from '../config/constants'
import type { Oracle, OracleState } from './predict-types'

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
