"use client";

import { useEffect, useRef, useState } from "react";
import { VenueMapPicker } from "./VenueMapPicker";

export interface SelectedVenue {
  branchId: string;
  displayName: string;
}

interface VenueResult {
  id: string;
  name: string;
  address: string;
}

/**
 * Searchable venue picker (PDF section 5.1's self-upload flow). Always
 * resolves to a real branchId before the parent form can submit — either
 * picked from InternalService.searchVenues's live fuzzy search, or freshly
 * created via InternalService.createVenue when nothing close enough exists.
 */
export function VenueCombobox({
  value,
  onChange,
  seedQuery,
}: {
  value: SelectedVenue | null;
  onChange: (venue: SelectedVenue | null) => void;
  /** Set from the upload page's vision-based venue detection to pre-run a search. */
  seedQuery?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<VenueResult[]>([]);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [newCommunity, setNewCommunity] = useState("");
  const [newCoords, setNewCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [savingVenue, setSavingVenue] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  async function runSearch(q: string) {
    const response = await fetch(`${apiUrl}/internal/venues?q=${encodeURIComponent(q)}`);
    if (!response.ok) return;
    setResults((await response.json()) as VenueResult[]);
  }

  useEffect(() => {
    if (seedQuery && seedQuery !== query) {
      setQuery(seedQuery);
      setOpen(true);
      void runSearch(seedQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleQueryChange(next: string) {
    setQuery(next);
    onChange(null); // any manual edit invalidates a prior selection
    setCreating(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void runSearch(next), 250);
    setOpen(true);
  }

  function handleFocus() {
    setOpen(true);
    if (results.length === 0) void runSearch(query);
  }

  function pickResult(result: VenueResult) {
    onChange({ branchId: result.id, displayName: result.name });
    setQuery(result.name);
    setOpen(false);
    setCreating(false);
  }

  function startCreating() {
    setCreating(true);
    setCreateError(null);
    setNewAddress("");
    setNewCommunity("");
    setNewCoords(null);
  }

  async function saveNewVenue() {
    if (!query.trim() || !newAddress.trim() || !newCommunity.trim() || !newCoords) {
      setCreateError("Fill in the address, area, and drop a pin on the map.");
      return;
    }
    setSavingVenue(true);
    setCreateError(null);
    try {
      const response = await fetch(`${apiUrl}/internal/venues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: query.trim(),
          address: newAddress.trim(),
          community: newCommunity.trim(),
          lat: newCoords.lat,
          lng: newCoords.lng,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setCreateError(body?.message ?? "Couldn't create the venue.");
        return;
      }
      const created = (await response.json()) as { id: string; name: string };
      onChange({ branchId: created.id, displayName: created.name });
      setQuery(created.name);
      setCreating(false);
      setOpen(false);
    } catch {
      setCreateError("Couldn't reach the server — please try again.");
    } finally {
      setSavingVenue(false);
    }
  }

  const isSelected = value !== null && value.displayName === query;

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(event) => handleQueryChange(event.target.value)}
        onFocus={handleFocus}
        placeholder="Search for a venue, e.g. Corner Kitchen"
        autoComplete="off"
        className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      {isSelected && <p className="mt-1 text-xs text-green-700">Selected: {value.displayName}</p>}

      {open && !creating && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-ink-300 bg-white shadow-lg">
          {results.length > 0 && (
            <ul className="max-h-56 overflow-y-auto py-1">
              {results.map((result) => (
                <li key={result.id}>
                  <button
                    type="button"
                    onClick={() => pickResult(result)}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-brand-50"
                  >
                    <span className="font-medium text-ink-900">{result.name}</span>
                    <span className="block text-xs text-ink-500">{result.address}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {query.trim().length > 0 ? (
            <button
              type="button"
              onClick={startCreating}
              className="block w-full border-t border-ink-200 px-3 py-2 text-left text-sm font-medium text-brand-600 hover:bg-brand-50"
            >
              + Add &quot;{query.trim()}&quot; as a new venue
            </button>
          ) : (
            results.length === 0 && <p className="px-3 py-2 text-sm text-ink-500">Start typing to search venues.</p>
          )}
        </div>
      )}

      {creating && (
        <div className="absolute z-10 mt-1 w-full space-y-3 rounded-lg border border-ink-300 bg-white p-4 shadow-lg">
          <p className="text-sm font-medium text-ink-900">Add &quot;{query.trim()}&quot; as a new venue</p>
          <div>
            <label htmlFor="newAddress" className="block text-xs font-medium text-ink-700">
              Address
            </label>
            <input
              id="newAddress"
              type="text"
              value={newAddress}
              onChange={(event) => setNewAddress(event.target.value)}
              placeholder="e.g. Marasi Drive, Business Bay, Dubai"
              className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div>
            <label htmlFor="newCommunity" className="block text-xs font-medium text-ink-700">
              Area / community
            </label>
            <input
              id="newCommunity"
              type="text"
              value={newCommunity}
              onChange={(event) => setNewCommunity(event.target.value)}
              placeholder="e.g. Business Bay"
              className="mt-1 w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <VenueMapPicker onPick={setNewCoords} />
          {createError && <p className="text-xs text-amber-600">{createError}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void saveNewVenue()}
              disabled={savingVenue}
              className="flex-1 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {savingVenue ? "Saving…" : "Save venue"}
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="rounded-lg border border-ink-300 px-3 py-2 text-sm text-ink-700 hover:border-ink-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
