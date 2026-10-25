"use client";

import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CircleMarker,
  LayerGroup,
  Map as LeafletMap,
  Polygon,
  Polyline,
} from "leaflet";
import { Crosshair, LocateFixed, Pencil, Undo2, X } from "lucide-react";
import type { LatLng, Plot } from "@/lib/types";
import { polygonAreaHa, polygonCentroid } from "@/lib/geo";
import { SOIL_WATER } from "@/lib/crops";
import { moisturePct, cx } from "@/lib/format";
import { statusFromMoisture } from "@/lib/et";

type LayerMode = "status" | "moisture" | "ndvi";

const MOISTURE_SCALE = ["#dc2626", "#f59e0b", "#eab308", "#84c341", "#24713e"];
const NDVI_SCALE = ["#a16207", "#d9b44a", "#c8d96f", "#84c341", "#1d5a33"];

function scaleColor(value: number, scale: string[]): string {
  const i = Math.min(scale.length - 1, Math.max(0, Math.floor((value / 100) * scale.length)));
  return scale[i];
}

function ndviColor(ndvi: number): string {
  const idx = Math.min(NDVI_SCALE.length - 1, Math.max(0, Math.floor(ndvi * NDVI_SCALE.length)));
  return NDVI_SCALE[idx];
}

export function FieldMap({
  plots,
  drawing,
  onCreate,
  onCancel,
  selectedId,
  onSelect,
  layerMode = "status",
  className,
}: {
  plots: Plot[];
  drawing: boolean;
  onCreate: (points: LatLng[], areaHa: number) => void;
  onCancel: () => void;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  layerMode?: LayerMode;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const tempRef = useRef<LayerGroup | null>(null);
  const pointsRef = useRef<LatLng[]>([]);
  const fittedRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [pointCount, setPointCount] = useState(0);
  const [drawArea, setDrawArea] = useState(0);

  // Init map once
  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      const map = L.map(containerRef.current, {
        center: [-0.2851, 36.0711],
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: true,
      });
      const tileUrl =
        process.env.NEXT_PUBLIC_MAP_TILE_URL ??
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
      L.tileLayer(tileUrl, {
        maxZoom: 19,
        attribution:
          process.env.NEXT_PUBLIC_MAP_ATTRIBUTION ??
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      L.control.scale({ imperial: false, position: "bottomright" }).addTo(map);
      mapRef.current = map;
      leafletRef.current = L;
      setReady(true);
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      leafletRef.current = null;
      layerRef.current = null;
      tempRef.current = null;
      setReady(false);
    };
  }, []);

  // Draw saved plots
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!ready || !L || !map) return;

    layerRef.current?.remove();
    const group = L.layerGroup().addTo(map);

    // Farm boundary
    L.polygon(
      [
        [-0.2824, 36.0664],
        [-0.2821, 36.0754],
        [-0.288, 36.0757],
        [-0.2882, 36.0667],
      ],
      {
        color: "#84c341",
        weight: 1.4,
        dashArray: "6 6",
        fill: false,
        opacity: 0.8,
      },
    )
      .bindTooltip("Riverside Farm boundary · 61.4 ha", {
        sticky: true,
        className: "plot-label",
        direction: "top",
      })
      .addTo(group);

    plots.forEach((plot) => {
      const soil = SOIL_WATER[plot.soil];
      const usable = moisturePct(plot.moisture, soil.wiltingPoint, soil.fieldCapacity);
      const status = statusFromMoisture(plot.moisture, plot.soil);
      const fill =
        layerMode === "ndvi"
          ? ndviColor(plot.ndvi)
          : layerMode === "moisture"
            ? scaleColor(usable, MOISTURE_SCALE)
            : plot.color;
      const border =
        status === "critical" ? "#b91c1c" : status === "attention" ? "#b45309" : "#1d5a33";
      const selected = selectedId === plot.id;

      const polygon: Polygon = L.polygon(plot.polygon, {
        color: selected ? "#0d1b14" : border,
        weight: selected ? 3 : 2,
        opacity: 0.95,
        fillColor: fill,
        fillOpacity: selected ? 0.42 : 0.28,
        dashArray: plot.system === "Rain-fed" ? "5 4" : undefined,
        interactive: !drawing,
      }).addTo(group);

      polygon.bindTooltip(plot.name, {
        permanent: true,
        direction: "center",
        className: "plot-label",
      });

      polygon.bindPopup(
        `<div style="min-width:180px">
          <p style="margin:0;font-size:12px;font-weight:700;color:#0d1b14">${plot.name}</p>
          <p style="margin:2px 0 8px;font-size:10px;color:#5b6b61">${plot.areaHa.toFixed(2)} ha · ${plot.variety}</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
            <div style="background:#f5f2e9;border-radius:8px;padding:6px">
              <p style="margin:0;font-size:8px;text-transform:uppercase;letter-spacing:.06em;color:#5f6e64">Usable water</p>
              <p style="margin:2px 0 0;font-size:12px;font-weight:700;color:#0d1b14">${usable}%</p>
            </div>
            <div style="background:#f5f2e9;border-radius:8px;padding:6px">
              <p style="margin:0;font-size:8px;text-transform:uppercase;letter-spacing:.06em;color:#5f6e64">NDVI</p>
              <p style="margin:2px 0 0;font-size:12px;font-weight:700;color:#0d1b14">${plot.ndvi.toFixed(2)}</p>
            </div>
          </div>
          <a href="/irrigation?plot=${plot.id}" style="display:block;margin-top:8px;background:#133b24;color:#fff;text-align:center;padding:6px;border-radius:8px;font-size:10px;font-weight:600;text-decoration:none">Open water balance</a>
        </div>`,
        { closeButton: false, offset: [0, -2] },
      );

      polygon.on("click", () => onSelect?.(plot.id));
    });

    if (!fittedRef.current && plots.length) {
      const bounds = L.latLngBounds(plots.flatMap((p) => p.polygon));
      map.fitBounds(bounds, { padding: [24, 24], maxZoom: 17 });
      fittedRef.current = true;
    }

    if (drawing) map.closePopup();

    return () => {
      group.remove();
    };
  }, [plots, ready, layerMode, selectedId, onSelect, drawing]);

  const resetTemp = useCallback(() => {
    tempRef.current?.remove();
    tempRef.current = null;
    pointsRef.current = [];
    setPointCount(0);
    setDrawArea(0);
  }, []);

  const redrawTemp = useCallback(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    tempRef.current?.remove();
    const group = L.layerGroup().addTo(map);
    tempRef.current = group;
    const pts = pointsRef.current;

    if (pts.length >= 2) {
      L.polyline(pts as [number, number][], {
        color: "#24713e",
        weight: 2,
        dashArray: "5 4",
      }).addTo(group);
    }
    if (pts.length >= 3) {
      L.polygon(pts as [number, number][], {
        color: "#24713e",
        weight: 2,
        fillColor: "#84c341",
        fillOpacity: 0.25,
        dashArray: "5 4",
      }).addTo(group);
    }
    pts.forEach((pt, i) => {
      const marker: CircleMarker = L.circleMarker(pt, {
        radius: i === 0 ? 6 : 4,
        color: "#0b2a19",
        weight: 2,
        fillColor: i === 0 ? "#84c341" : "#ffffff",
        fillOpacity: 1,
      }).addTo(group);
      if (i === 0) marker.bindTooltip("Start", { permanent: true, direction: "top", className: "plot-label" });
    });
  }, []);

  // Drawing mode
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!ready || !L || !map) return;

    if (!drawing) {
      resetTemp();
      containerRef.current?.classList.remove("cursor-crosshair");
      map.doubleClickZoom.enable();
      return;
    }

    pointsRef.current = [];
    setPointCount(0);
    setDrawArea(0);
    containerRef.current?.classList.add("cursor-crosshair");
    map.doubleClickZoom.disable();

    const onClick = (event: { latlng: { lat: number; lng: number } }) => {
      const point: LatLng = [
        Number(event.latlng.lat.toFixed(7)),
        Number(event.latlng.lng.toFixed(7)),
      ];
      pointsRef.current = [...pointsRef.current, point];
      setPointCount(pointsRef.current.length);
      setDrawArea(polygonAreaHa(pointsRef.current));
      redrawTemp();
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };

    map.on("click", onClick);
    window.addEventListener("keydown", onKey);

    return () => {
      map.off("click", onClick);
      window.removeEventListener("keydown", onKey);
      containerRef.current?.classList.remove("cursor-crosshair");
    };
  }, [drawing, ready, redrawTemp, resetTemp, onCancel]);

  const finish = () => {
    if (pointsRef.current.length < 3) return;
    const pts = [...pointsRef.current];
    const area = Number(polygonAreaHa(pts).toFixed(2));
    onCreate(pts, area);
    resetTemp();
  };

  const undo = () => {
    pointsRef.current = pointsRef.current.slice(0, -1);
    setPointCount(pointsRef.current.length);
    setDrawArea(polygonAreaHa(pointsRef.current));
    redrawTemp();
  };

  const locate = () => {
    const map = mapRef.current;
    if (!map) return;
    map.locate({ setView: true, maxZoom: 17, timeout: 6000 });
  };

  return (
    <div className={cx("relative overflow-hidden rounded-2xl border border-[#e3e6dd] bg-[#e8eee3]", className)}>
      <div ref={containerRef} className="h-full w-full" aria-label="Interactive farm map" />

      {!ready && (
        <div className="absolute inset-0 z-[500] flex items-center justify-center bg-[#eef2e9]">
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[11px] font-semibold text-[#5b6b61] shadow-card">
            <span className="h-2 w-2 animate-pulse rounded-full bg-canopy-500" />
            Loading field map…
          </div>
        </div>
      )}

      {/* Layer legend */}
      {ready && !drawing && (
        <div className="pointer-events-none absolute bottom-6 left-3 z-[400] rounded-xl border border-[#e3e6dd] bg-white/95 px-3 py-2 shadow-card backdrop-blur">
          <p className="text-[8.5px] font-semibold uppercase tracking-[0.12em] text-[#5f6e64]">
            {layerMode === "ndvi" ? "NDVI" : layerMode === "moisture" ? "Usable water" : "Plot status"}
          </p>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="h-1.5 w-20 rounded-full" style={{
              background:
                layerMode === "status"
                  ? "linear-gradient(90deg,#dc2626,#f59e0b,#84c341)"
                  : `linear-gradient(90deg, ${(layerMode === "ndvi" ? NDVI_SCALE : MOISTURE_SCALE).join(",")})`,
            }} />
            <div className="flex justify-between w-full text-[8px] text-[#5f6e64]">
              <span>{layerMode === "ndvi" ? "0.2" : "Low"}</span>
              <span>{layerMode === "ndvi" ? "1.0" : "High"}</span>
            </div>
          </div>
        </div>
      )}

      {/* Map actions */}
      {ready && !drawing && (
        <div className="absolute right-3 top-3 z-[400] flex flex-col gap-2">
          <button
            type="button"
            onClick={locate}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e3e6dd] bg-white text-canopy-800 shadow-card transition hover:bg-canopy-50"
            title="Center on my location"
            aria-label="Center on my location"
          >
            <LocateFixed size={15} />
          </button>
        </div>
      )}

      {/* Draw overlay */}
      {drawing && (
        <>
          <div className="absolute left-1/2 top-3 z-[500] flex w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 items-center gap-2 rounded-xl bg-canopy-950/95 px-3 py-2 text-white shadow-lift backdrop-blur">
            <Pencil size={14} className="shrink-0 text-lime-400" />
            <p className="flex-1 text-[10.5px] leading-tight">
              {pointCount === 0
                ? "Tap the map to add your first corner."
                : pointCount < 3
                  ? `Add ${3 - pointCount} more corner${pointCount === 2 ? "" : "s"} to close the plot.`
                  : `${pointCount} corners · ${drawArea.toFixed(2)} ha`}
            </p>
            {pointCount > 0 && (
              <button
                type="button"
                onClick={undo}
                className="rounded-lg bg-white/10 p-1.5 hover:bg-white/20"
                aria-label="Undo last corner"
                title="Undo last corner"
              >
                <Undo2 size={13} />
              </button>
            )}
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg bg-white/10 p-1.5 hover:bg-white/20"
              aria-label="Cancel drawing"
              title="Cancel"
            >
              <X size={13} />
            </button>
          </div>

          <div className="absolute bottom-3 left-1/2 z-[500] flex w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 items-center gap-2 rounded-xl border border-[#e3e6dd] bg-white/95 p-2 shadow-lift backdrop-blur">
            <div className="flex-1 px-1">
              <p className="text-[9px] uppercase tracking-wider text-[#5f6e64]">Measured area</p>
              <p className="font-display text-[16px] font-semibold leading-tight">
                {drawArea > 0 ? `${drawArea.toFixed(2)} ha` : "—"}
              </p>
            </div>
            <button
              type="button"
              onClick={finish}
              disabled={pointCount < 3}
              className="btn-primary btn-sm"
            >
              <Crosshair size={12} /> Save plot
            </button>
          </div>
        </>
      )}
    </div>
  );
}
