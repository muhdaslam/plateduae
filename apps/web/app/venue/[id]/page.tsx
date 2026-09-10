import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { FreshnessBadge } from "@/components/FreshnessBadge";

const CHANNEL_LABELS: Record<string, string> = {
  dine_in: "Dine-in",
  delivery: "Delivery",
  takeaway: "Takeaway",
};

/**
 * Venue detail page (PDF section 4.1: "Full structured menu, hours,
 * location, outbound links to that venue's own channels"). Hours and
 * outbound ordering links aren't in the data model as dedicated fields yet
 * (see geo-venue.service.ts's comments) — outboundChannels is currently a
 * proxy list of channels this branch has a menu for, not clickable links.
 */
export default async function VenuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ data: venue }, { data: menu }] = await Promise.all([
    apiClient.GET("/v1/venues/{id}", { params: { path: { id } } }),
    apiClient.GET("/v1/venues/{id}/menu", { params: { path: { id } } }),
  ]);

  if (!venue) {
    return <p className="text-ink-500">Venue not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-ink-500 hover:text-brand-600">
          ← Back to search
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-ink-900">{venue.brandName}</h1>
        <p className="text-sm text-ink-500">
          {venue.address} · {venue.community}
        </p>
        {venue.outboundChannels.length > 0 && (
          <div className="mt-2 flex gap-1.5">
            {venue.outboundChannels.map((channel) => (
              <span key={channel} className="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-700">
                {CHANNEL_LABELS[channel] ?? channel}
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-ink-700">Menu</h2>
        {(!menu || menu.items.length === 0) && (
          <p className="rounded-lg border border-dashed border-ink-300 px-4 py-8 text-center text-sm text-ink-500">
            No menu items published yet.
          </p>
        )}
        {menu && menu.items.length > 0 && (
          <ul className="divide-y divide-ink-300 rounded-xl border border-ink-300 bg-white">
            {menu.items.map((item) => {
              const priceFreshness = item.freshness.find((f) => f.field === "base_price");
              return (
                <li key={item.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="font-medium text-ink-900">{item.name}</p>
                    {priceFreshness && (
                      <FreshnessBadge lastVerifiedAt={priceFreshness.lastVerifiedAt} stale={priceFreshness.stale} />
                    )}
                  </div>
                  <div className="shrink-0 font-semibold text-ink-900">
                    {item.currency} {item.basePrice.toFixed(2)}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
