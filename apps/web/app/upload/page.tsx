import { UploadMenuForm } from "@/components/UploadMenuForm";

/**
 * Restaurant self-upload entry point (PDF section 5.1). No owner auth exists
 * yet, so this is a simple public form rather than a scoped dashboard — the
 * venue is free text, resolved server-side against real branches (see
 * InternalService.resolveBranchId for why that isn't a public "list venues"
 * endpoint's job).
 */
export default function UploadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Upload a menu</h1>
        <p className="mt-1 text-sm text-ink-500">
          Add a photo or PDF of a menu and we&apos;ll extract dishes and prices automatically.
        </p>
      </div>

      <UploadMenuForm />
    </div>
  );
}
