/**
 * Neighbourhood price-index page stub (PDF section 11.3: programmatic SEO
 * on dish and neighbourhood pages is the highest-priority demand channel —
 * "best shawarma in Business Bay"-shaped queries). No backing endpoint
 * exists yet in Appendix A; this route just reserves the URL shape and
 * SSR wiring point for when that content/index feature is built (v2,
 * section 4.3).
 */
export default async function NeighbourhoodPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold capitalize text-ink-900">{slug.replace(/-/g, " ")}</h1>
      <p className="text-sm text-ink-500">Neighbourhood price index — coming later.</p>
    </div>
  );
}
