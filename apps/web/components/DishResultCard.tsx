import Link from "next/link";
import { PriceBadge } from "./PriceBadge";
import { FreshnessBadge } from "./FreshnessBadge";

export interface DishResultCardProps {
  menuItemId: string;
  canonicalDishId: string;
  venueId: string;
  dishName: string;
  venueName: string;
  distanceKm: number;
  price: number;
  currency: string;
  priceVsMedian: "below" | "at" | "above";
  lastVerifiedAt: string;
}

export function DishResultCard(item: DishResultCardProps) {
  return (
    <li className="rounded-xl border border-ink-300 bg-white p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link href={`/dish/${item.canonicalDishId}`} className="font-semibold text-ink-900 hover:text-brand-600">
            {item.dishName}
          </Link>
          <p className="truncate text-sm text-ink-500">
            <Link href={`/venue/${item.venueId}`} className="hover:text-ink-700 hover:underline">
              {item.venueName}
            </Link>
            {item.distanceKm > 0 && <span> · {item.distanceKm.toFixed(1)} km away</span>}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-semibold text-ink-900">
            {item.currency} {item.price.toFixed(2)}
          </div>
          <PriceBadge status={item.priceVsMedian} />
        </div>
      </div>
      <div className="mt-2">
        <FreshnessBadge lastVerifiedAt={item.lastVerifiedAt} />
      </div>
    </li>
  );
}
