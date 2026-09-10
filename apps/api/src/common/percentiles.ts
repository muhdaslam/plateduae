/**
 * Simple nearest-rank percentiles over a small in-memory price array.
 * Good enough for scaffold-scale result sets (tens of rows); a materialised
 * dish_market_stat table (section 8) is the real answer once something
 * populates it on publish events — see catalogue.service.ts's note.
 */
export function percentiles(values: number[]): { p25: number; median: number; p75: number; sampleSize: number } {
  const sorted = [...values].sort((a, b) => a - b);
  const at = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))]!;
  return {
    p25: at(0.25),
    median: at(0.5),
    p75: at(0.75),
    sampleSize: sorted.length,
  };
}
