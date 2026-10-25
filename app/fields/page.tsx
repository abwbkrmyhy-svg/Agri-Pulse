"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Layers,
  MapPin,
  Pencil,
  Plus,
  Ruler,
  Satellite,
  Sprout,
  X,
} from "lucide-react";
import { FieldMap } from "@/components/field-map";
import { MoistureRing } from "@/components/moisture-ring";
import { StatusBadge } from "@/components/status-badge";
import { useFarm } from "@/providers/farm-provider";
import { CROPS, SOIL_WATER } from "@/lib/crops";
import { DEMO_TODAY, cropFor, plotDay, plotStage, plotStatus } from "@/lib/data";
import { statusFromMoisture } from "@/lib/et";
import { formatArea, moisturePct, cx, formatDate } from "@/lib/format";
import type { CropId, LatLng, Plot, SoilTexture } from "@/lib/types";

type Draft = {
  name: string;
  crop: CropId;
  variety: string;
  soil: SoilTexture;
  system: Plot["system"];
  plantedAt: string;
  applicationRate: number;
  irrigationEfficiency: number;
  polygon: LatLng[];
  areaHa: number;
};

const SOILS = Object.keys(SOIL_WATER) as SoilTexture[];
const SYSTEMS: Plot["system"][] = ["Drip", "Pivot", "Sprinkler", "Rain-fed"];

export default function FieldsPage() {
  const { plots, addPlot } = useFarm();
  const [layer, setLayer] = useState<"status" | "moisture" | "ndvi">("status");
  const [drawing, setDrawing] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);

  const totalArea = plots.reduce((s, p) => s + p.areaHa, 0);
  const selectedPlot = plots.find((p) => p.id === selected);

  const sorted = useMemo(
    () => [...plots].sort((a, b) => a.name.localeCompare(b.name)),
    [plots],
  );

  function handleCreated(points: LatLng[], areaHa: number) {
    setDrawing(false);
    setDraft({
      name: `New plot ${plots.length + 1}`,
      crop: "maize",
      variety: "Local hybrid",
      soil: "Loam",
      system: "Drip",
      plantedAt: DEMO_TODAY,
      applicationRate: 4,
      irrigationEfficiency: 0.85,
      polygon: points,
      areaHa,
    });
  }

  function saveDraft() {
    if (!draft) return;
    const crop = CROPS[draft.crop];
    const id = `plot-${Date.now()}`;
    const plot: Plot = {
      id,
      name: draft.name.trim() || "Untitled plot",
      crop: draft.crop,
      variety: draft.variety || crop.label,
      plantedAt: draft.plantedAt,
      areaHa: draft.areaHa,
      soil: draft.soil,
      moisture: Math.round((SOIL_WATER[draft.soil].fieldCapacity - 3) * 10) / 10,
      rootDepthM: crop.rootDepthM,
      ndvi: 0.42,
      polygon: draft.polygon,
      system: draft.system,
      applicationRate: draft.system === "Rain-fed" ? 0 : draft.applicationRate,
      irrigationEfficiency: draft.irrigationEfficiency,
      color: crop.color,
      lastIrrigated: DEMO_TODAY,
    };
    addPlot(plot);
    setSelected(id);
    setDraft(null);
  }

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="card card-pad">
          <p className="eyebrow">Mapped area</p>
          <p className="mt-1.5 font-display text-[24px] font-semibold leading-none">
            {totalArea.toFixed(2)}
            <span className="ml-1 text-[12px] font-medium text-[#5b6b61]">ha</span>
          </p>
          <p className="mt-1 text-[10px] text-[#5b6b61]">Across {plots.length} production plots</p>
        </div>
        <div className="card card-pad">
          <p className="eyebrow">Crops tracked</p>
          <p className="mt-1.5 font-display text-[24px] font-semibold leading-none">
            {new Set(plots.map((p) => p.crop)).size}
            <span className="ml-1 text-[12px] font-medium text-[#5b6b61]">species</span>
          </p>
          <p className="mt-1 text-[10px] text-[#5b6b61]">Maize, beans, tomato, pasture, wheat</p>
        </div>
        <div className="card card-pad">
          <p className="eyebrow">Boundary accuracy</p>
          <p className="mt-1.5 font-display text-[24px] font-semibold leading-none">
            ±1.2<span className="ml-1 text-[12px] font-medium text-[#5b6b61]">m</span>
          </p>
          <p className="mt-1 text-[10px] text-[#5b6b61]">WGS 84 · geodesic area</p>
        </div>
        <div className="card card-pad">
          <p className="eyebrow">Satellite refresh</p>
          <p className="mt-1.5 flex items-baseline gap-1.5 font-display text-[24px] font-semibold leading-none">
            10<span className="text-[12px] font-medium text-[#5b6b61]">m</span>
          </p>
          <p className="mt-1 flex items-center gap-1 text-[10px] text-canopy-700">
            <Satellite size={10} /> Sentinel-2 · 21 Oct
          </p>
        </div>
      </section>

      {/* Map */}
      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef0e9] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-canopy-50 text-canopy-700">
              <MapPin size={16} />
            </span>
            <div>
              <h2 className="text-[13px] font-semibold leading-tight">Riverside Farm</h2>
              <p className="text-[10px] text-[#5b6b61]">Nakuru · 61.4 ha boundary · {plots.length} mapped plots</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-[#d9dfd5] bg-white p-0.5">
              {(
                [
                  { key: "status", label: "Status" },
                  { key: "moisture", label: "Moisture" },
                  { key: "ndvi", label: "NDVI" },
                ] as const
              ).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setLayer(item.key)}
                  className={cx(
                    "rounded-[10px] px-2.5 py-1.5 text-[10.5px] font-semibold transition",
                    layer === item.key
                      ? "bg-canopy-800 text-white shadow-sm"
                      : "text-[#5b6b61] hover:text-ink",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setDrawing((d) => !d);
              }}
              className={drawing ? "btn-secondary btn-sm" : "btn-primary btn-sm"}
            >
              {drawing ? <X size={12} /> : <Pencil size={12} />}
              {drawing ? "Cancel drawing" : "Draw plot"}
            </button>
          </div>
        </div>

        <FieldMap
          plots={plots}
          drawing={drawing}
          onCreate={handleCreated}
          onCancel={() => setDrawing(false)}
          selectedId={selected}
          onSelect={setSelected}
          layerMode={layer}
          className="h-[440px] rounded-none border-0 sm:h-[520px]"
        />

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#eef0e9] px-4 py-2.5 text-[10px] text-[#5b6b61] sm:px-5">
          <span className="flex items-center gap-1.5">
            <Layers size={11} /> Click a polygon to inspect · pinch or scroll to zoom
          </span>
          <span className="flex items-center gap-1.5">
            <Ruler size={11} /> Areas computed geodesically (WGS 84)
          </span>
        </div>
      </section>

      {/* Selected plot strip */}
      {selectedPlot && (
        <section className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <MoistureRing
            value={moisturePct(
              selectedPlot.moisture,
              SOIL_WATER[selectedPlot.soil].wiltingPoint,
              SOIL_WATER[selectedPlot.soil].fieldCapacity,
            )}
            status={plotStatus(selectedPlot)}
            size={64}
          />
          <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <p className="eyebrow">Plot</p>
              <p className="mt-0.5 text-[12.5px] font-semibold">{selectedPlot.name}</p>
              <p className="text-[10px] text-[#5b6b61]">
                {cropFor(selectedPlot).label} · {formatArea(selectedPlot.areaHa)}
              </p>
            </div>
            <div>
              <p className="eyebrow">Growth stage</p>
              <p className="mt-0.5 text-[12.5px] font-semibold">{plotStage(selectedPlot).label}</p>
              <p className="text-[10px] text-[#5b6b61]">Day {plotDay(selectedPlot)} of {cropFor(selectedPlot).cycleDays}</p>
            </div>
            <div>
              <p className="eyebrow">Irrigation</p>
              <p className="mt-0.5 text-[12.5px] font-semibold">{selectedPlot.system}</p>
              <p className="text-[10px] text-[#5b6b61]">
                {selectedPlot.applicationRate} mm/h · {Math.round(selectedPlot.irrigationEfficiency * 100)}% eff.
              </p>
            </div>
            <div>
              <p className="eyebrow">Last irrigated</p>
              <p className="mt-0.5 text-[12.5px] font-semibold">
                {formatDate(selectedPlot.lastIrrigated)}
              </p>
              <p className="text-[10px] text-[#5b6b61]">{selectedPlot.soil}</p>
            </div>
          </div>
          <Link href={`/irrigation?plot=${selectedPlot.id}`} className="btn-primary btn-sm shrink-0">
            Water balance <ArrowRight size={12} />
          </Link>
        </section>
      )}

      {/* Plot table */}
      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eef0e9] px-5 py-4">
          <div>
            <p className="eyebrow">Plot registry</p>
            <h2 className="mt-0.5 font-display text-[16px] font-semibold tracking-[-0.02em]">
              All fields
            </h2>
          </div>
          <button type="button" onClick={() => setDrawing(true)} className="btn-secondary btn-sm">
            <Plus size={12} /> New plot
          </button>
        </div>

        <div className="hidden grid-cols-[1.4fr_1fr_0.8fr_1.1fr_0.7fr_0.9fr_auto] gap-3 border-b border-[#eef0e9] bg-sand-50 px-5 py-2 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#5f6e64] md:grid">
          <span>Plot</span>
          <span>Crop / stage</span>
          <span>Area</span>
          <span>Soil water</span>
          <span>NDVI</span>
          <span>Status</span>
          <span />
        </div>

        <ul className="divide-soft">
          {sorted.map((plot) => {
            const soil = SOIL_WATER[plot.soil];
            const usable = moisturePct(plot.moisture, soil.wiltingPoint, soil.fieldCapacity);
            const status = statusFromMoisture(plot.moisture, plot.soil);
            const stage = plotStage(plot);
            const crop = cropFor(plot);
            return (
              <li key={plot.id}>
                <button
                  type="button"
                  onClick={() => setSelected(plot.id)}
                  className={cx(
                    "grid w-full grid-cols-2 items-center gap-3 px-4 py-3 text-left transition hover:bg-canopy-50/60 sm:px-5 md:grid-cols-[1.4fr_1fr_0.8fr_1.1fr_0.7fr_0.9fr_auto]",
                    selected === plot.id && "bg-canopy-50/80",
                  )}
                >
                  <div className="col-span-2 flex items-center gap-2.5 md:col-span-1">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[15px]"
                      style={{ backgroundColor: `${plot.color}18` }}
                    >
                      {crop.emoji}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold">{plot.name}</p>
                      <p className="text-[10px] text-[#5b6b61]">{plot.variety}</p>
                    </div>
                  </div>
                  <div className="text-[11px]">
                    <p className="font-medium text-ink">{crop.label}</p>
                    <p className="text-[10px] text-[#5b6b61]">{stage.label} · day {plotDay(plot)}</p>
                  </div>
                  <p className="text-[11px] font-semibold">{formatArea(plot.areaHa)}</p>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#eef0e9]">
                        <div
                          className={cx(
                            "h-full rounded-full",
                            status === "optimal"
                              ? "bg-canopy-500"
                              : status === "attention"
                                ? "bg-amber-500"
                                : "bg-red-500",
                          )}
                          style={{ width: `${usable}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-[#5b6b61]">{usable}%</span>
                    </div>
                    <p className="mt-0.5 text-[9px] text-[#5f6e64]">{plot.soil} · {plot.system}</p>
                  </div>
                  <p className="text-[11px] font-semibold">
                    {plot.ndvi.toFixed(2)}
                    <span className="ml-1 text-[9px] font-medium text-[#5f6e64]">
                      {plot.ndvi >= 0.7 ? "good" : plot.ndvi >= 0.55 ? "fair" : "low"}
                    </span>
                  </p>
                  <StatusBadge status={status} />
                  <span className="hidden justify-self-end text-[#5f6e64] md:block">
                    <ArrowRight size={14} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Create plot modal */}
      {draft && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-canopy-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
            <div className="flex items-start justify-between border-b border-[#eef0e9] px-5 py-4">
              <div>
                <p className="eyebrow">New plot</p>
                <h2 className="mt-0.5 font-display text-[18px] font-semibold tracking-[-0.02em]">
                  Register mapped area
                </h2>
                <p className="mt-1 flex items-center gap-1 text-[10.5px] text-canopy-700">
                  <Ruler size={11} /> {draft.areaHa.toFixed(2)} ha · {draft.polygon.length} corners
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="rounded-lg p-1.5 text-[#5f6e64] hover:bg-sand-100 hover:text-ink"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
              <div>
                <label className="label" htmlFor="plot-name">Plot name</label>
                <input
                  id="plot-name"
                  className="input"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="e.g. South Block"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="plot-crop">Crop</label>
                  <select
                    id="plot-crop"
                    className="input"
                    value={draft.crop}
                    onChange={(e) => {
                      const crop = e.target.value as CropId;
                      setDraft({
                        ...draft,
                        crop,
                        variety: CROPS[crop].label,
                      });
                    }}
                  >
                    {Object.values(CROPS).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.emoji} {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="plot-variety">Variety</label>
                  <input
                    id="plot-variety"
                    className="input"
                    value={draft.variety}
                    onChange={(e) => setDraft({ ...draft, variety: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="plot-soil">Soil texture</label>
                  <select
                    id="plot-soil"
                    className="input"
                    value={draft.soil}
                    onChange={(e) => setDraft({ ...draft, soil: e.target.value as SoilTexture })}
                  >
                    {SOILS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="plot-planted">Planting date</label>
                  <input
                    id="plot-planted"
                    type="date"
                    className="input"
                    value={draft.plantedAt}
                    onChange={(e) => setDraft({ ...draft, plantedAt: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="plot-system">Irrigation system</label>
                  <select
                    id="plot-system"
                    className="input"
                    value={draft.system}
                    onChange={(e) => setDraft({ ...draft, system: e.target.value as Plot["system"] })}
                  >
                    {SYSTEMS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="plot-rate">Application rate (mm/h)</label>
                  <input
                    id="plot-rate"
                    type="number"
                    step="0.1"
                    min="0"
                    className="input"
                    value={draft.applicationRate}
                    disabled={draft.system === "Rain-fed"}
                    onChange={(e) => setDraft({ ...draft, applicationRate: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="rounded-xl bg-canopy-50 px-3 py-2.5 text-[10.5px] leading-relaxed text-canopy-800">
                <span className="font-semibold">Area & root depth are inferred.</span> Root depth is set
                from the crop profile, and the field capacity from the soil texture. You can refine both
                after saving.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#eef0e9] px-5 py-3.5">
              <button type="button" className="btn-secondary" onClick={() => setDraft(null)}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={saveDraft}>
                <Check size={14} /> Save plot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Buildup note */}
      <p className="flex items-center gap-1.5 px-1 text-[10px] text-[#5f6e64]">
        <Sprout size={11} /> Drawing a polygon updates the area, water balance and irrigation plan
        immediately.
      </p>
    </div>
  );
}
