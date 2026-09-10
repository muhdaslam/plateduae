import { apiClient } from "@/lib/api-client";
import { UploadMenuForm } from "@/components/UploadMenuForm";

// Without this, Next statically prerenders the venue list at build time —
// new branches wouldn't show up on the picker until the next deploy.
export const dynamic = "force-dynamic";

/**
 * Restaurant self-upload entry point (PDF section 5.1). No owner auth exists
 * yet, so this is a simple public form rather than a scoped dashboard — the
 * venue picker comes from GET /internal/branches (see branch-list.dto.ts for
 * why that endpoint isn't part of the public Appendix A surface).
 */
export default async function UploadPage() {
  const { data: branches, error } = await apiClient.GET("/internal/branches");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Upload a menu</h1>
        <p className="mt-1 text-sm text-ink-500">
          Add a photo or PDF of a menu and we&apos;ll extract dishes and prices automatically.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Couldn&apos;t load the list of venues — please try again shortly.
        </p>
      )}

      {branches && branches.length === 0 && (
        <p className="rounded-lg border border-dashed border-ink-300 px-4 py-8 text-center text-sm text-ink-500">
          No venues yet — add a restaurant and branch first.
        </p>
      )}

      {branches && branches.length > 0 && <UploadMenuForm branches={branches} />}
    </div>
  );
}
