/** Clean rupee display — never show raw floats like ₹39.73 */
export function formatInr(n: number) {
  const whole = Math.round(Number.isFinite(n) ? n : 0);
  return `₹${whole.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

/** Whole-number RQI for display */
export function formatRqi(n: number) {
  return String(Math.round(Number.isFinite(n) ? n : 0));
}

export function formatCompact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('en-IN');
}

export function formatChartMonth(month: string) {
  const [y, m] = month.split('-');
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${names[Number(m) - 1]} '${y.slice(2)}`;
}

export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}