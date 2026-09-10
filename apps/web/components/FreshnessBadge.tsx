// PDF section 5.4: "every price in the UI carries a last-verified date,
// and anything past TTL is visibly degraded... being transparently
// uncertain preserves trust; being confidently wrong destroys it."
const PRICE_TTL_DAYS = 30;

function daysAgo(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export function FreshnessBadge({
  lastVerifiedAt,
  ttlDays = PRICE_TTL_DAYS,
  stale: staleOverride,
}: {
  lastVerifiedAt: string;
  ttlDays?: number;
  /** Pass this when the API already computed staleness server-side (e.g.
   * GET /v1/venues/:id/menu's per-field freshness) instead of
   * recomputing it here against a hardcoded TTL that may not match. */
  stale?: boolean;
}) {
  const age = daysAgo(lastVerifiedAt);
  const stale = staleOverride ?? age > ttlDays;
  const label = age === 0 ? "Verified today" : age === 1 ? "Verified 1 day ago" : `Verified ${age} days ago`;

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs ${stale ? "text-amber-600" : "text-ink-500"}`}
      title={stale ? "Past the 30-day freshness window — treat this price as approximate." : label}
    >
      {stale && <span aria-hidden>⚠</span>}
      {stale ? "Price may be outdated" : label}
    </span>
  );
}
