interface PriceDistribution {
  p25: number;
  median: number;
  p75: number;
  sampleSize: number;
}

/** Simple visual range bar (not a full chart library — the data shape is
 * three points plus a sample size, a chart dependency would be overkill). */
export function PriceRangeBar({ distribution, currency }: { distribution: PriceDistribution; currency: string }) {
  const { p25, median, p75, sampleSize } = distribution;
  const min = Math.min(p25, median) * 0.9;
  const max = Math.max(p75, median) * 1.1 || 1;
  const toPercent = (value: number) => `${(((value - min) / (max - min)) * 100).toFixed(1)}%`;

  return (
    <div>
      <div className="relative h-2 rounded-full bg-ink-100">
        <div
          className="absolute h-2 rounded-full bg-brand-100"
          style={{ left: toPercent(p25), right: `${100 - Number.parseFloat(toPercent(p75))}%` }}
        />
        <div
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand-600 shadow"
          style={{ left: toPercent(median) }}
          title={`Median: ${currency} ${median.toFixed(2)}`}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-ink-500">
        <span>
          {currency} {p25.toFixed(2)}
        </span>
        <span className="font-medium text-ink-700">
          {currency} {median.toFixed(2)} median
        </span>
        <span>
          {currency} {p75.toFixed(2)}
        </span>
      </div>
      <p className="mt-1 text-xs text-ink-500">Across {sampleSize} nearby {sampleSize === 1 ? "venue" : "venues"}</p>
    </div>
  );
}
