/**
 * An artist's personal revenue goal for the Wallet page's progress bar.
 * Purely a personal target, not backend data — kept per-user in
 * localStorage, same reasoning as lib/gigGuide.ts / lib/tickets.ts.
 */
const KEY_PREFIX = "fimiya_revenue_goal_";
const DEFAULT_GOAL_ZAR = 50_000;

export function getRevenueGoal(userId: string): number {
  if (typeof window === "undefined") return DEFAULT_GOAL_ZAR;
  const raw = localStorage.getItem(KEY_PREFIX + userId);
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_GOAL_ZAR;
}

export function setRevenueGoal(userId: string, goalZar: number): void {
  localStorage.setItem(KEY_PREFIX + userId, String(goalZar));
}
