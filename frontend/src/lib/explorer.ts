// Block-explorer URL builders with input validation.
// BASE comes from constants.ts so swapping explorers is a one-line config change.

import { EXPLORER_BASE } from '../config/constants'

const TX_DIGEST_RE = /^[1-9A-HJ-NP-Za-km-z]{32,64}$/
const HEX_ID_RE = /^0x[0-9a-fA-F]{1,64}$/

export function explorerTxUrl(digest: string): string | null {
  if (!TX_DIGEST_RE.test(digest)) return null
  return `${EXPLORER_BASE}/tx/${digest}`
}

export function explorerObjectUrl(id: string): string | null {
  if (!HEX_ID_RE.test(id)) return null
  return `${EXPLORER_BASE}/object/${id}`
}

export function explorerAccountUrl(addr: string): string | null {
  if (!HEX_ID_RE.test(addr)) return null
  return `${EXPLORER_BASE}/account/${addr}`
}