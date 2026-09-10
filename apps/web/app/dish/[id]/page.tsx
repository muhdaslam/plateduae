import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { PriceRangeBar } from "@/components/PriceRangeBar";
import { PriceBadge } from "@/components/PriceBadge";
import { FreshnessBadge } from "@/components/FreshnessBadge";

/** Presentational-only classification, not the API's own priceVsMedian
 * (that field only exists on search results) — mirrors the same 2%
 * tolerance band search.service.ts uses, applied against this dish's own
 * priceDistribution.median so the comparison card (anchor user story 2)
 * has a below/at/above indicator per offer. */
function classify(price: number, median: number): "below" | "at" | "above" {
  const tolerance = median * 0.02;
  if (price < median - tolerance) return "below";
  if (price > median + tolerance) return "above";
  return "at";
}

/**
 * Canonical dish page (PDF section 4.1: "all nearby venues serving it,
 * price distribution, cheapest and nearest highlights"; anchor user story
 * 2: dine-in vs delivery price, side by side). SSR for the SEO strategy in
 * section 11.3 ("chicken shawarma price Dubai").
 */
export default async function DishPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lat?: string; lng?: string }>;
}) {
  const { id } = await params;
  const { lat, lng } = await searchParams;

  const [{ data: dish }, { data: offers }] = await Promise.all([
    apiClient.GET("/v1/dishes/{id}", { params: { path: { id } } }),
    apiClient.GET("/v1/dishes/{id}/offers", {
      params: { path: { id }, query: { lat: lat ? Number(lat) : undefined, lng: lng ? Number(lng) : undefined } },
    }),
  ]);

  if (!dish) {
    return <p className="text-ink-500">Dish not found.</p>;
  }

  const median = dish.priceDistribution?.median;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-ink-500 hover:text-brand-600">
          ← Back to search
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-ink-900">{dish.canonicalName}</h1>
        {dish.nameAr && <p className="text-ink-500" dir="rtl">{dish.nameAr}</p>}
        {dish.cuisine && (
          <span className="mt-2 inline-block rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-700">
            {dish.cuisine}
          </span>
        )}
      </div>

      {dish.priceDistribution && (
        <div className="rounded-xl border border-ink-300 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-ink-700">Price range nearby</h2>
          <PriceRangeBar distribution={dish.priceDistribution} currency={offers?.[0]?.currency ?? "AED"} />
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold text-ink-700">Where to get it</h2>
        {(!offers || offers.length === 0) && (
          <p className="rounded-lg border border-dashed border-ink-300 px-4 py-8 text-center text-sm text-ink-500">
            No confirmed venues serving this dish nearby yet.
          </p>
        )}
        {offers && offers.length > 0 && (
          <ul className="space-y-3">
            {offers.map((offer) => (
              <li key={offer.menuItemId} className="rounded-xl border border-ink-300 bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link href={`/venue/${offer.venueId}`} className="font-semibold text-ink-900 hover:text-brand-600">
                      {offer.venueName}
                    </Link>
                    {offer.distanceKm > 0 && (
                      <p className="text-sm text-ink-500">{offer.distanceKm.toFixed(1)} km away</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-semibold text-ink-900">
                      {offer.currency} {offer.price.toFixed(2)}
                    </div>
                    {median !== undefined && <PriceBadge status={classify(offer.price, median)} />}
                  </div>
                </div>
                <div className="mt-2">
                  <FreshnessBadge lastVerifiedAt={offer.lastVerifiedAt} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
