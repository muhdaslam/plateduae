import { apiClient } from "@/lib/api-client";

/**
 * Canonical dish page stub (PDF section 4.1: "Canonical dish page: all
 * nearby venues serving it, price distribution, cheapest and nearest
 * highlights."). SSR for the SEO strategy in section 11.3 ("chicken
 * shawarma price Dubai"). Not built out yet — just wired to the API.
 */
export default async function DishPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: dish } = await apiClient.GET("/v1/dishes/{id}", {
    params: { path: { id } },
  });

  if (!dish) {
    return <main>Dish not found.</main>;
  }

  return (
    <main>
      <h1>{dish.canonicalName}</h1>
      {dish.priceDistribution && (
        <p>
          Median {dish.priceDistribution.median} across {dish.priceDistribution.sampleSize} venues
        </p>
      )}
    </main>
  );
}
