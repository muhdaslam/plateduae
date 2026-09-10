"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

type SortOption = "relevance" | "price_asc" | "price_desc" | "distance";

export function SearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const hasLocation = searchParams.get("lat") !== null && searchParams.get("lng") !== null;

  function buildParams(overrides: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(overrides)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    return params;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const q = String(form.get("q") ?? "").trim();
    const sort = String(form.get("sort") ?? "relevance");
    const maxPrice = String(form.get("maxPrice") ?? "").trim();

    const params = buildParams({
      q: q || null,
      sort: sort === "relevance" ? null : sort,
      filters: maxPrice ? `price_ceiling:${maxPrice}` : null,
    });
    router.push(`/?${params.toString()}`);
  }

  function useMyLocation() {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("Your browser doesn't support geolocation.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const params = buildParams({
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6),
        });
        router.push(`/?${params.toString()}`);
      },
      () => {
        setLocating(false);
        setLocationError("Couldn't get your location — showing results without a distance filter.");
      },
      { timeout: 8000 },
    );
  }

  const currentPriceCeiling = searchParams.get("filters")?.match(/price_ceiling:(\d+(\.\d+)?)/)?.[1] ?? "";

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-ink-300 bg-white p-4">
      <div className="flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={searchParams.get("q") ?? ""}
          placeholder="Search a dish, e.g. chicken shawarma"
          className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Search
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-1.5 text-ink-700">
          Max price
          <input
            type="number"
            name="maxPrice"
            min={0}
            step="1"
            defaultValue={currentPriceCeiling}
            placeholder="AED"
            className="w-20 rounded-lg border border-ink-300 px-2 py-1 focus:border-brand-500 focus:outline-none"
          />
        </label>

        <label className="flex items-center gap-1.5 text-ink-700">
          Sort
          <select
            name="sort"
            defaultValue={(searchParams.get("sort") as SortOption) ?? "relevance"}
            className="rounded-lg border border-ink-300 px-2 py-1 focus:border-brand-500 focus:outline-none"
          >
            <option value="relevance">Best match</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
            <option value="distance">Nearest first</option>
          </select>
        </label>

        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="ml-auto rounded-lg border border-ink-300 px-3 py-1 text-ink-700 hover:border-brand-500 hover:text-brand-600 disabled:opacity-50"
        >
          {locating ? "Locating…" : hasLocation ? "📍 Using your location" : "📍 Use my location"}
        </button>
      </div>

      {locationError && <p className="text-xs text-amber-600">{locationError}</p>}
    </form>
  );
}
