import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface ParcelMapProps {
  geojson: string | any;
  claimedArea: number;
  calculatedArea: number;
  khasraNumber: string;
}

export function ParcelMap({ geojson, claimedArea, calculatedArea, khasraNumber }: ParcelMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const geojsonLayer = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // 1. Initialize map if not yet initialized
    if (!leafletMap.current) {
      leafletMap.current = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: true
      }).setView([17.0, 78.0], 15);

      // Simple grid or map tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(leafletMap.current);
    }

    // 2. Clear previous GeoJSON boundaries
    if (geojsonLayer.current && leafletMap.current) {
      leafletMap.current.removeLayer(geojsonLayer.current);
    }

    // 3. Render new GeoJSON parcel boundaries
    if (geojson) {
      try {
        const data = typeof geojson === 'string' ? JSON.parse(geojson) : geojson;
        
        // Custom styling: red color on discrepancy > 10%, emerald green if okay
        const diff = Math.abs(claimedArea - calculatedArea);
        const diffPct = (diff / claimedArea) * 100;
        const color = diffPct > 10 ? '#ef4444' : '#10b981';

        geojsonLayer.current = L.geoJSON(data, {
          style: {
            color: color,
            weight: 3,
            fillColor: color,
            fillOpacity: 0.15
          }
        }).addTo(leafletMap.current);

        // Adjust map camera bounds to fit the parcel coordinates
        const bounds = geojsonLayer.current.getBounds();
        if (bounds.isValid()) {
          leafletMap.current.fitBounds(bounds, { padding: [15, 15] });
        }
      } catch (e) {
        console.error("Failed to parse and render GeoJSON coordinate array:", e);
      }
    }

    // Resize leafet map canvas to prevent gray-box visual bugs
    setTimeout(() => {
      if (leafletMap.current) {
        leafletMap.current.invalidateSize();
      }
    }, 100);

  }, [geojson, claimedArea, calculatedArea]);

  // Determine alert status
  const diff = Math.abs(claimedArea - calculatedArea);
  const diffPct = (diff / claimedArea) * 100;
  const isMismatch = diffPct > 10;

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded overflow-hidden shadow-sm">
      <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex items-center justify-between text-xs shrink-0">
        <span className="font-bold text-slate-600 flex items-center gap-1.5">
          🗺️ Khasra Boundary — Plot {khasraNumber}
        </span>
        {isMismatch ? (
          <span className="px-1.5 py-0.5 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 rounded">
            ⚠️ AREA MISMATCH ({diffPct.toFixed(1)}% discrepancy)
          </span>
        ) : (
          <span className="px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded">
            ✓ Spatial Tolerances Met
          </span>
        )}
      </div>
      
      {/* Map Element */}
      <div className="flex-1 min-h-0 relative" ref={mapRef} style={{ height: '100%' }} />

      <div className="bg-slate-50 border-t border-slate-250 p-3 grid grid-cols-3 text-center divide-x divide-slate-200 text-[10px] shrink-0">
        <div>
          <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">Claimed Area</span>
          <span className="text-slate-700 font-bold">{claimedArea.toFixed(2)} Ac</span>
        </div>
        <div>
          <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">GIS Computed</span>
          <span className="text-slate-700 font-bold">{calculatedArea.toFixed(2)} Ac</span>
        </div>
        <div>
          <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">Discrepancy</span>
          <span className={`font-bold ${isMismatch ? 'text-red-600' : 'text-slate-600'}`}>
            {diffPct.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}
export default ParcelMap;
