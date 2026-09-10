"use client";

import { useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { VenueCombobox, type SelectedVenue } from "./VenueCombobox";

type Channel = "dine_in" | "delivery" | "takeaway";

const DEFAULT_CHANNEL: Channel = "dine_in";
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "application/pdf"];

type Status = { kind: "idle" } | { kind: "submitting" } | { kind: "success"; jobId: string } | { kind: "error"; message: string };

/**
 * Client-side because a multipart file upload needs a real <input type="file">
 * plus FormData — the typed openapi-fetch client (lib/api-client.ts) is built
 * for JSON bodies, so this posts directly with fetch instead.
 *
 * Dropping/selecting a file immediately fires POST /internal/detect-venue (a
 * quick single-image vision call) to seed the venue combobox's search query
 * — see InternalService.detectVenue. The user still has to pick (or create)
 * a real venue themselves; nothing here trusts the vision hint directly.
 */
export function UploadMenuForm() {
  const [file, setFile] = useState<File | null>(null);
  const [venue, setVenue] = useState<SelectedVenue | null>(null);
  const [venueSeedQuery, setVenueSeedQuery] = useState<string | undefined>(undefined);
  const [channel, setChannel] = useState<Channel>(DEFAULT_CHANNEL);
  const [dragActive, setDragActive] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  async function handleFile(selected: File) {
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setStatus({ kind: "error", message: "Please choose a PNG, JPEG, WEBP, or PDF file." });
      return;
    }

    setFile(selected);
    setStatus({ kind: "idle" });
    setDetectError(null);
    setDetecting(true);
    try {
      const formData = new FormData();
      formData.append("file", selected);
      const response = await fetch(`${apiUrl}/internal/detect-venue`, { method: "POST", body: formData });
      if (!response.ok) throw new Error("detect-venue failed");
      const { name } = (await response.json()) as { name: string };
      setVenueSeedQuery(name);
    } catch {
      setDetectError("Couldn't detect the venue automatically — search for it below.");
    } finally {
      setDetecting(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    const dropped = event.dataTransfer.files[0];
    if (dropped) void handleFile(dropped);
  }

  function handleFileInputChange(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    if (picked) void handleFile(picked);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setStatus({ kind: "error", message: "Choose a menu photo or PDF first." });
      return;
    }
    if (!venue) {
      setStatus({ kind: "error", message: "Pick a venue from the search results, or add it as a new one." });
      return;
    }

    setStatus({ kind: "submitting" });
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("branchId", venue.branchId);
      formData.append("channel", channel);
      const response = await fetch(`${apiUrl}/internal/upload`, { method: "POST", body: formData });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setStatus({ kind: "error", message: body?.message ?? `Upload failed (${response.status}).` });
        return;
      }

      const { jobId } = (await response.json()) as { jobId: string };
      setStatus({ kind: "success", jobId });
      setFile(null);
      setVenue(null);
      setVenueSeedQuery(undefined);
      setChannel(DEFAULT_CHANNEL);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      setStatus({ kind: "error", message: "Couldn't reach the server — please try again." });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-ink-300 bg-white p-4">
      <div>
        <label className="block text-sm font-medium text-ink-700">Menu photo or PDF</label>
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload a menu photo or PDF"
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") fileInputRef.current?.click();
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`mt-1 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-10 text-center text-sm transition-colors ${
            dragActive ? "border-brand-500 bg-brand-50" : "border-ink-300 bg-ink-50 hover:border-brand-400"
          }`}
        >
          {file ? (
            <p className="font-medium text-ink-900">{file.name}</p>
          ) : (
            <>
              <p className="font-medium text-ink-700">Drag and drop a menu photo or PDF</p>
              <p className="mt-1 text-ink-500">or click to browse</p>
            </>
          )}
          <input
            ref={fileInputRef}
            id="file"
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
        {detecting && <p className="mt-1 text-xs text-ink-500">Detecting venue…</p>}
        {detectError && <p className="mt-1 text-xs text-amber-600">{detectError}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-ink-700">Venue</label>
        <div className="mt-1">
          <VenueCombobox value={venue} onChange={setVenue} seedQuery={venueSeedQuery} />
        </div>
      </div>

      <div>
        <label htmlFor="channel" className="block text-sm font-medium text-ink-700">
          Channel
        </label>
        <select
          id="channel"
          value={channel}
          onChange={(event) => setChannel(event.target.value as Channel)}
          className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="dine_in">Dine-in</option>
          <option value="delivery">Delivery</option>
          <option value="takeaway">Takeaway</option>
        </select>
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
