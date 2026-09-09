import { apiClient } from "@/lib/api-client";

/**
 * Venue detail page stub (PDF section 4.1: full structured menu, hours,
 * location, outbound links). Not built out yet — just wired to the API.
 */
export default async function VenuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: venue } = await apiClient.GET("/v1/venues/{id}", {
    params: { path: { id } },
  });

  if (!venue) {
    return <main>Venue not found.</main>;
  }

  return (
    <main>
      <h1>{venue.brandName}</h1>
      <p>{venue.address}</p>
    </main>
  );
}
