"use client";

import { useState, type FormEvent } from "react";

interface BranchOption {
  id: string;
  restaurantName: string;
  address: string;
  community: string;
}

const DEFAULT_CHANNEL: "dine_in" | "delivery" | "takeaway" = "dine_in";

type Status = { kind: "idle" } | { kind: "submitting" } | { kind: "success"; jobId: string } | { kind: "error"; message: string };

/**
 * Client-side because a multipart file upload needs a real <input type="file">
 * plus FormData — the typed openapi-fetch client (lib/api-client.ts) is built
 * for JSON bodies, so this posts directly with fetch instead.
 */
export function UploadMenuForm({ branches }: { branches: BranchOption[] }) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    if (!(formData.get("file") as File)?.size) {
      setStatus({ kind: "error", message: "Choose a menu photo or PDF first." });
      return;
    }

    setStatus({ kind: "submitting" });
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
      const response = await fetch(`${apiUrl}/internal/upload`, { method: "POST", body: formData });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setStatus({ kind: "error", message: body?.message ?? `Upload failed (${response.status}).` });
        return;
      }

      const { jobId } = (await response.json()) as { jobId: string };
      setStatus({ kind: "success", jobId });
      form.reset();
    } catch {
      setStatus({ kind: "error", message: "Couldn't reach the server — please try again." });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-ink-300 bg-white p-4">
      <div>
        <label htmlFor="branchId" className="block text-sm font-medium text-ink-700">
          Venue
        </label>
        <select
          id="branchId"
          name="branchId"
          required
          defaultValue=""
          className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="" disabled>
            Select a venue…
          </option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.restaurantName} — {branch.community}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="channel" className="block text-sm font-medium text-ink-700">
          Channel
        </label>
        <select
          id="channel"
          name="channel"
          defaultValue={DEFAULT_CHANNEL}
          className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="dine_in">Dine-in</option>
          <option value="delivery">Delivery</option>
          <option value="takeaway">Takeaway</option>
        </select>
      </div>

      <div>
        <label htmlFor="file" className="block text-sm font-medium text-ink-700">
          Menu photo or PDF
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept="image/*,application/pdf"
          required
          className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
        />
      </div>

      <button
        type="submit"
        disabled={status.kind === "submitting"}
        className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {status.kind === "submitting" ? "Uploading…" : "Upload menu"}
      </button>

      {status.kind === "success" && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          Uploaded — we&apos;re extracting dishes and prices now. This usually takes a minute or two.
        </p>
      )}
      {status.kind === "error" && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">{status.message}</p>
      )}
    </form>
  );
}
