export function formatNumber(value: number, decimals = 0): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`
  return value.toFixed(decimals)
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export function formatTrend(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
}
