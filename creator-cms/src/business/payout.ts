export function getNextPayoutDate(): string {
  const now = new Date();
  const payout = new Date(now.getFullYear(), now.getMonth(), 15);
  if (now.getDate() >= 15) payout.setMonth(payout.getMonth() + 1);
  return payout.toISOString().split('T')[0];
}