export function formatUsd(rawNineDecimal: number): string {
    return (rawNineDecimal / 1e9).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    })
  }
  
export function formatExpiry(unixMs: number): string {
    const now = Date.now()
    const diff = unixMs - now
    if (diff < 0) return 'expired'

    const hours = Math.floor(diff / 3_600_000)
    const days = Math.floor(hours / 24)
    if (days > 0) return `${days}d ${hours % 24}h`
    if (hours > 0) return `${hours}h`
    
    return `${Math.floor(diff / 60_000)}m`
}
  