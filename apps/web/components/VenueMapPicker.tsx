"use client";

import { useEffect, useRef, useState } from "react";
import { Map as MapLibreMap, Marker, NavigationControl, type MapMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const DUBAI_CENTER: [number, number] = [55.2708, 25.2048]; // lng, lat

// Free, no-API-key raster style — OpenStreetMap tiles directly. There's no
// geocoding integration in this codebase (see venue.dto.ts), so this map is
// the only way a self-uploader can give a new venue a real coordinate.
const OSM_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster" as const, source: "osm" }],
};

export function VenueMapPicker({ onPick }: { onPick: (coords: { lat: number; lng: number }) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: OSM_STYLE,
      center: DUBAI_CENTER,
      zoom: 11,
    });
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");

    map.on("click", (event: MapMouseEvent) => {
      const { lng, lat } = event.lngLat;
      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat]);
      } else {
        markerRef.current = new Marker({ color: "#c2410c" }).setLngLat([lng, lat]).addTo(map);
      }
      setCoords({ lat, lng });
      onPick({ lat, lng });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div ref={containerRef} className="h-56 w-full rounded-lg border border-ink-300" />
      <p className="mt-1 text-xs text-ink-500">
        {coords
          ? `Pinned at ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
          : "Click the map to drop a pin at the venue's location."}
      </p>
    </div>
  );
}
