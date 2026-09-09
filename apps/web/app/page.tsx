import { apiClient } from "@/lib/api-client";

/**
 * Home / search shell (PDF section 4.1 MVP scope). Server component: does a
 * real (if currently empty) round trip to GET /v1/search on every render,
 * so the web <-> api wiring is provably correct before ranking/search
 * logic exists. Future work: query input UX, filters, results list — see
 * section 9 for the ranking design this will eventually render.
 */
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const { data, error } = await apiClient.GET("/v1/search", {
    params: { query: { q } },
  });

  return (
    <main>
      <h1>Plated</h1>
      <form action="/">
        <input type="text" name="q" defaultValue={q} placeholder="Search a dish, e.g. chicken shawarma" />
        <button type="submit">Search</button>
      </form>
      {error && <p>Search is not available yet.</p>}
      {data && data.items.length === 0 && <p>No results yet — the catalogue is still empty.</p>}
      <ul>
        {data?.items.map((item) => (
          <li key={`${item.venueId}-${item.canonicalDishId}`}>
            {item.dishName} — {item.venueName} — {item.price} {item.currency}
          </li>
        ))}
      </ul>
    </main>
  );
}
