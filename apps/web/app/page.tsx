import { apiClient } from "@/lib/api-client";
import { SearchForm } from "@/components/SearchForm";
import { DishResultCard } from "@/components/DishResultCard";

type SortOption = "relevance" | "price_asc" | "price_desc" | "distance";

/**
 * Home / search page (PDF section 4.1 MVP scope, anchor user stories 1 and
 * 4). Server component: reads filters straight from the URL so the search
 * is a real SSR round trip on every load (good for the SEO strategy in
 * section 11.3), while SearchForm (a client component) handles building
 * that URL from user input, including optional geolocation.
 */
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; lat?: string; lng?: string; radius?: string; filters?: string; sort?: string }>;
}) {
  const { q, lat, lng, radius, filters, sort } = await searchParams;

  const { data, error } = await apiClient.GET("/v1/search", {
    params: {
      query: {
        q,
        lat: lat ? Number(lat) : undefined,
        lng: lng ? Number(lng) : undefined,
        radius: radius ? Number(radius) : undefined,
        filters,
        sort: sort as SortOption | undefined,
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Find a dish, not just a restaurant</h1>
        <p className="mt-1 text-sm text-ink-500">
          Compare what the same dish costs at kitchens near you.
        </p>
      </div>

      <SearchForm />

      {error && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Search isn&apos;t available right now — please try again shortly.
        </p>
      )}

      {data && data.items.length === 0 && (
        <p className="rounded-lg border border-dashed border-ink-300 px-4 py-8 text-center text-sm text-ink-500">
          {q ? `No results for "${q}" yet.` : "Search for a dish, or use your location to browse what's nearby."}
        </p>
      )}

      {data && data.items.length > 0 && (
        <ul className="space-y-3">
          {data.items.map((item) => (
            <DishResultCard key={item.menuItemId} {...item} />
          ))}
        </ul>
      )}
    </div>
  );
}
