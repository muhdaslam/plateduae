const LABELS: Record<"below" | "at" | "above", string> = {
  below: "Cheaper here",
  at: "Typical price",
  above: "Pricier here",
};

const STYLES: Record<"below" | "at" | "above", string> = {
  below: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20",
  at: "bg-ink-100 text-ink-700 ring-1 ring-inset ring-ink-300",
  above: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
};

export function PriceBadge({ status }: { status: "below" | "at" | "above" }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
