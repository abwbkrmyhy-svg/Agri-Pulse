"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Beaker,
  CheckCircle2,
  FlaskConical,
  Leaf,
  RefreshCw,
  Satellite,
  Sprout,
  TriangleAlert,
} from "lucide-react";
import { useFarm } from "@/providers/farm-provider";
import { SOIL_TESTS, cropFor, plotDay, plotStage, plotStatus } from "@/lib/data";
import { SOIL_WATER } from "@/lib/crops";
import { moisturePct, cx, formatDate } from "@/lib/format";
import { MoistureRing } from "@/components/moisture-ring";
import { StatusBadge } from "@/components/status-badge";
import { NdviTrendChart, type NdviPoint } from "@/components/charts/ndvi-trend";
import type { Plot, SoilTest } from "@/lib/types";

const NDVI_COLORS = ["#8a4b1e", "#a16207", "#c0a13a", "#9bbb4e", "#6aa42f", "#358d51", "#1d5a33"];

function colorFor(ndvi: number) {
  const idx = Math.min(
    NDVI_COLORS.length - 1,
    Math.max(0, Math.floor(((ndvi - 0.15) / 0.85) * NDVI_COLORS.length)),
  );
  return NDVI_COLORS[idx];
}

function hash(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function buildCells(plot: Plot) {
  const seed = hash(plot.id);
  return Array.from({ length: 8 * 14 }, (_, i) => {
    const row = Math.floor(i / 14);
    const col = i % 14;
    const noise = (((Math.sin(seed + i * 12.9898) * 43758.5453) % 1) + 1) % 1;
    const stress = row >= 5 && col <= 3 ? Math.min(0.34, plot.ndvi * 0.42) : 0;
    const edge = row === 0 ? 0.05 : 0;
    const value = Math.max(
      0.18,
      Math.min(0.94, plot.ndvi + (noise - 0.5) * 0.22 - stress - edge),
    );
    return { value, stress: stress > 0, row, col };
  });
}

function nutrientMeta(value: number, min: number, max: number) {
  if (value < min) {
    const pct = Math.max(10, Math.round((value / min) * 100));
    return { label: "Low", tone: "text-amber-700", bar: "bg-amber-500", pct };
  }
  if (value > max) {
    const pct = 100;
    return { label: "High", tone: "text-sky-700", bar: "bg-sky-500", pct };
  }
  return { label: "Optimal", tone: "text-canopy-700", bar: "bg-canopy-500", pct: Math.round((value / max) * 100) };
}

function HealthView() {
  const params = useSearchParams();
  const { plots, notify } = useFarm();
  const initial = plots.find((p) => p.id === params.get("plot")) ?? plots[0];
  const [selectedId, setSelectedId] = useState(initial?.id ?? "");
  const plot = plots.find((p) => p.id === selectedId) ?? plots[0];

  const cells = useMemo(() => (plot ? buildCells(plot) : []), [plot]);
  const stressCells = cells.filter((c) => c.stress).length;

  const trend = useMemo<NdviPoint[]>(() => {
    if (!plot) return [];
    const seed = hash(plot.id + "trend");
    return ["W36", "W37", "W38", "W39", "W40", "W41", "W42", "W43"].map((label, i) => {
      const wave = Math.sin(seed + i * 0.9) * 0.03;
      const base = plot.ndvi + 0.16 - i * 0.02;
      return {
        label,
        ndvi: Math.max(0.2, Math.min(0.95, Number((base + wave).toFixed(2)))),
        farm: Number((0.73 + Math.sin(seed * 0.1 + i) * 0.015).toFixed(2)),
      };
    });
  }, [plot]);

  if (!plot) {
    return <p className="card card-pad text-sm text-[#5b6b61]">Add a plot to view crop health.</p>;
  }

  const crop = cropFor(plot);
  const stage = plotStage(plot);
  const day = plotDay(plot);
  const soil = SOIL_WATER[plot.soil];
  const usable = moisturePct(plot.moisture, soil.wiltingPoint, soil.fieldCapacity);
  const test: SoilTest =
    SOIL_TESTS[plot.id] ?? {
      ph: 6.4,
      nitrogen: 26,
      phosphorus: 15,
      potassium: 190,
      organicMatter: 2.6,
      ec: 0.38,
      sampledAt: "2026-10-12",
    };

  const previous = trend[trend.length - 2]?.ndvi ?? plot.ndvi;
  const delta = Number((plot.ndvi - previous).toFixed(2));

  const nutrients = [
    { key: "N", label: "Nitrogen", value: test.nitrogen, min: 20, max: 40, unit: "ppm" },
    { key: "P", label: "Phosphorus", value: test.phosphorus, min: 10, max: 25, unit: "ppm" },
    { key: "K", label: "Potassium", value: test.potassium, min: 150, max: 250, unit: "ppm" },
    { key: "OM", label: "Organic matter", value: test.organicMatter, min: 2, max: 5, unit: "%" },
  ];

  const actions = [
    {
      warn: test.nitrogen < 20,
      text:
        test.nitrogen < 20
          ? `Top-dress ${Math.max(12, Math.round((20 - test.nitrogen) * 1.6))} kg N/ha before the next rain event.`
          : "Nitrogen is inside the target band — hold the next top-dress and re-test after harvest.",
    },
    {
      warn: test.ph < 6,
      text:
        test.ph < 6
          ? "Apply agricultural lime at 1.2 t/ha to lift pH toward 6.3; incorporate before planting."
          : "pH is in the ideal range for nutrient availability on this soil.",
    },
    {
      warn: plot.ndvi < 0.62,
      text:
        plot.ndvi < 0.62
          ? "Walk the low-vigour strip before the next satellite pass; check for leaf rust and waterlogging."
          : "Canopy vigour is stable; no scouting anomaly beyond the usual field variability.",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Plot switcher */}
      <section className="card flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {plots.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedId(p.id)}
              className={cx(
                "rounded-xl px-3 py-2 text-[11px] font-semibold transition",
                p.id === plot.id
                  ? "bg-canopy-800 text-white shadow-sm"
                  : "border border-[#e3e6dd] bg-white text-[#415047] hover:border-canopy-300",
              )}
            >
              {cropFor(p).emoji} {p.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 text-[10px] text-[#5b6b61] sm:flex">
            <Satellite size={11} className="text-canopy-600" />
            Sentinel-2 · 21 Oct · 4% cloud
          </span>
          <button
            type="button"
            onClick={() => notify("NDVI layer refreshed from the latest Sentinel-2 scene", "info")}
            className="btn-secondary btn-sm"
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <div className="space-y-5">
          {/* NDVI heatmap */}
          <section className="card overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-2 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-[17px]"
                  style={{ backgroundColor: `${plot.color}18` }}
                >
                  {crop.emoji}
                </span>
                <div>
                  <p className="eyebrow">Vegetation index</p>
                  <h2 className="mt-0.5 font-display text-[16px] font-semibold tracking-[-0.02em]">
                    {plot.name} NDVI
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="chip bg-canopy-50 text-canopy-800">{plot.areaHa.toFixed(2)} ha</span>
                <span className="chip bg-sand-100 text-[#415047]">10 m</span>
              </div>
            </div>

            <div className="mx-5 overflow-hidden rounded-xl border border-[#e3e6dd]">
              <div
                className="grid gap-[2px] bg-[#dfe8da] p-[2px]"
                style={{ gridTemplateColumns: "repeat(14, minmax(0, 1fr))" }}
                role="img"
                aria-label={`NDVI heat map for ${plot.name}. Mean ${plot.ndvi.toFixed(2)}.`}
              >
                {cells.map((cell, i) => (
                  <div
                    key={i}
                    title={`NDVI ${cell.value.toFixed(2)}${cell.stress ? " · low vigour zone" : ""}`}
                    className={cx(
                      "aspect-square transition hover:brightness-110",
                      cell.stress && "ring-1 ring-inset ring-amber-300/80",
                    )}
                    style={{ backgroundColor: colorFor(cell.value) }}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="text-[8.5px] text-[#5f6e64]">0.2</span>
                <span
                  className="h-2 w-36 rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${NDVI_COLORS.join(",")})`,
                  }}
                />
                <span className="text-[8.5px] text-[#5f6e64]">1.0</span>
              </div>
              <div className="flex items-center gap-2 text-[9px] text-[#5b6b61]">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-sm bg-[#8a4b1e]" /> Bare / stressed
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-sm bg-[#358d51]" /> Vigorous
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-sm ring-1 ring-amber-400" /> Low-vigour
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 border-t border-[#eef0e9] sm:grid-cols-4">
              {[
                { label: "Mean NDVI", value: plot.ndvi.toFixed(2) },
                { label: "Week change", value: `${delta >= 0 ? "+" : ""}${delta.toFixed(2)}`, tone: delta >= 0 ? "text-canopy-700" : "text-red-700" },
                { label: "Low-vigour cells", value: `${stressCells} / ${cells.length}` },
                { label: "Canopy cover", value: `${Math.round(plot.ndvi * 100)}%` },
              ].map((s, i) => (
                <div
                  key={s.label}
                  className={cx(
                    "px-4 py-3",
                    i > 0 && "border-l border-[#eef0e9]",
                    i >= 2 && "border-t sm:border-t-0",
                  )}
                >
                  <p className="text-[8.5px] uppercase tracking-[0.1em] text-[#5f6e64]">{s.label}</p>
                  <p className={cx("mt-1 text-[14px] font-semibold", s.tone)}>{s.value}</p>
                </div>
              ))}
            </div>
          </section>

          {/* NDVI trend */}
          <section className="card card-pad">
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow">Season trend</p>
                <h2 className="mt-0.5 font-display text-[16px] font-semibold tracking-[-0.02em]">
                  Eight weeks of canopy vigour
                </h2>
              </div>
              <div className="flex flex-col items-end gap-1 text-[9px] text-[#5b6b61]">
                <span className="flex items-center gap-1">
                  <span className="h-[2px] w-4 bg-canopy-600" /> This plot
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-[2px] w-4 border-t border-dashed border-[#66756a]" /> Farm avg.
                </span>
              </div>
            </div>
            <div className="mt-2">
              <NdviTrendChart data={trend} />
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-[#5b6b61]">
              {delta < 0
                ? `NDVI slipped ${Math.abs(delta).toFixed(2)} since last week. The low-vigour cluster sits in the south-west corner — scout there first.`
                : `NDVI gained ${delta.toFixed(2)} this week and is tracking above the farm average.`}
            </p>
          </section>

          {/* Growth stage */}
          <section className="card card-pad">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="eyebrow">Phenology</p>
                <h2 className="mt-0.5 font-display text-[16px] font-semibold tracking-[-0.02em]">
                  Growth stage timeline
                </h2>
              </div>
              <span className="chip bg-sand-100 text-[#415047]">
                Day {day} of {crop.cycleDays}
              </span>
            </div>

            <div className="mt-5 flex h-3 w-full gap-1">
              {crop.stages.map((s) => {
                const width = ((s.endDay - s.startDay) / crop.cycleDays) * 100;
                const active = s.key === stage.key;
                return (
                  <div
                    key={s.key}
                    className={cx(
                      "relative h-full rounded-full",
                      active ? "bg-canopy-600" : "bg-[#e3e6dd]",
                    )}
                    style={{ width: `${width}%` }}
                    title={`${s.label} · day ${s.startDay}–${s.endDay}`}
                  >
                    {active && (
                      <span className="absolute -top-1 left-1/2 h-5 w-5 -translate-x-1/2 rounded-full border-[3px] border-white bg-canopy-700 shadow" />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex gap-1">
              {crop.stages.map((s) => (
                <div key={s.key} style={{ width: `${((s.endDay - s.startDay) / crop.cycleDays) * 100}%` }}>
                  <p
                    className={cx(
                      "text-[9px] leading-tight",
                      s.key === stage.key ? "font-semibold text-canopy-800" : "text-[#5f6e64]",
                    )}
                  >
                    {s.label}
                  </p>
                  <p className="text-[8px] text-[#66756a]">Kc {s.kc}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-xl bg-sand-50 px-3 py-2.5">
                <p className="text-[8.5px] uppercase tracking-wide text-[#5f6e64]">Planted</p>
                <p className="mt-0.5 text-[11.5px] font-semibold">{formatDate(plot.plantedAt, { day: "numeric", month: "short", year: "numeric" })}</p>
              </div>
              <div className="rounded-xl bg-sand-50 px-3 py-2.5">
                <p className="text-[8.5px] uppercase tracking-wide text-[#5f6e64]">Harvest est.</p>
                <p className="mt-0.5 text-[11.5px] font-semibold">
                  {formatDate(new Date(Date.parse(`${plot.plantedAt}T00:00:00Z`) + crop.cycleDays * 86400000).toISOString().slice(0, 10), { day: "numeric", month: "short" })}
                </p>
              </div>
              <div className="rounded-xl bg-sand-50 px-3 py-2.5">
                <p className="text-[8.5px] uppercase tracking-wide text-[#5f6e64]">Kc now</p>
                <p className="mt-0.5 text-[11.5px] font-semibold">{stage.kc}</p>
              </div>
              <div className="rounded-xl bg-sand-50 px-3 py-2.5">
                <p className="text-[8.5px] uppercase tracking-wide text-[#5f6e64]">Root depth</p>
                <p className="mt-0.5 text-[11.5px] font-semibold">{plot.rootDepthM} m</p>
              </div>
            </div>
          </section>
        </div>

        {/* Right rail */}
        <div className="space-y-5">
          {/* Summary */}
          <section className="card card-pad">
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow">Plot snapshot</p>
                <h2 className="mt-0.5 font-display text-[17px] font-semibold tracking-[-0.02em]">
                  {plot.name}
                </h2>
              </div>
              <StatusBadge status={plotStatus(plot)} />
            </div>

            <div className="mt-4 flex items-center gap-4">
              <MoistureRing value={usable} status={plotStatus(plot)} size={88} />
              <div className="min-w-0 flex-1 space-y-2">
                <div>
                  <p className="text-[9px] uppercase tracking-wide text-[#5f6e64]">NDVI</p>
                  <p className="font-display text-[24px] font-semibold leading-none">
                    {plot.ndvi.toFixed(2)}
                    <span className={cx("ml-1.5 text-[10px] font-semibold", delta >= 0 ? "text-canopy-600" : "text-red-700")}>
                      {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(2)}
                    </span>
                  </p>
                </div>
                <p className="text-[10px] leading-snug text-[#5b6b61]">
                  {crop.label} · {stage.label} · {plot.soil.toLowerCase()}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-sand-50 px-3 py-2.5">
                <p className="text-[8.5px] uppercase tracking-wide text-[#5f6e64]">Soil moisture</p>
                <p className="mt-0.5 text-[12px] font-semibold">{plot.moisture}% VWC</p>
              </div>
              <div className="rounded-xl bg-sand-50 px-3 py-2.5">
                <p className="text-[8.5px] uppercase tracking-wide text-[#5f6e64]">Usable water</p>
                <p className="mt-0.5 text-[12px] font-semibold">{usable}%</p>
              </div>
            </div>

            <Link href={`/irrigation?plot=${plot.id}`} className="btn-primary mt-3 w-full">
              <Sprout size={14} /> Plan irrigation
            </Link>
          </section>

          {/* Soil test */}
          <section className="card card-pad">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-clay-500/10 text-clay-600">
                  <FlaskConical size={15} />
                </span>
                <div>
                  <p className="eyebrow">Lab results</p>
                  <h2 className="mt-0.5 font-display text-[15px] font-semibold tracking-[-0.02em]">
                    Soil test
                  </h2>
                </div>
              </div>
              <span className="text-[9px] text-[#5f6e64]">{formatDate(test.sampledAt)}</span>
            </div>

            <div className="mt-4 space-y-3">
              {nutrients.map((n) => {
                const meta = nutrientMeta(n.value, n.min, n.max);
                return (
                  <div key={n.key}>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-medium text-[#415047]">{n.label}</span>
                      <span className={cx("font-semibold", meta.tone)}>
                        {n.value} {n.unit} · {meta.label}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#eef0e9]">
                      <div className={cx("h-full rounded-full", meta.bar)} style={{ width: `${meta.pct}%` }} />
                    </div>
                    <div className="mt-0.5 flex justify-between text-[8px] text-[#66756a]">
                      <span>Target {n.min}–{n.max} {n.unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[#eef0e9] pt-3">
              <div>
                <p className="text-[8.5px] uppercase tracking-wide text-[#5f6e64]">pH (H₂O)</p>
                <p className="mt-0.5 text-[13px] font-semibold">{test.ph.toFixed(1)}</p>
                <div className="relative mt-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#d9a441] via-[#84c341] to-[#2d8fbf]">
                  <span
                    className="absolute -top-1 h-3.5 w-1 rounded-full border border-white bg-ink"
                    style={{ left: `${Math.min(97, Math.max(2, ((test.ph - 4) / 5) * 100))}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[7.5px] text-[#66756a]">
                  <span>4.0</span><span>7.0</span><span>9.0</span>
                </div>
              </div>
              <div>
                <p className="text-[8.5px] uppercase tracking-wide text-[#5f6e64]">EC (salinity)</p>
                <p className="mt-0.5 text-[13px] font-semibold">{test.ec} dS/m</p>
                <p className="mt-1 text-[9px] text-canopy-700">Safe · below 1.0</p>
                <p className="text-[8px] text-[#66756a]">No leaching needed</p>
              </div>
            </div>
          </section>

          {/* Actions */}
          <section className="card card-pad">
            <div className="flex items-center gap-2">
              <Beaker size={15} className="text-canopy-700" />
              <h2 className="font-display text-[15px] font-semibold tracking-[-0.02em]">
                Agronomy actions
              </h2>
            </div>
            <ul className="mt-3 space-y-2.5">
              {actions.map((a, i) => (
                <li key={i} className="flex items-start gap-2">
                  {a.warn ? (
                    <TriangleAlert size={13} className="mt-0.5 shrink-0 text-amber-600" />
                  ) : (
                    <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-canopy-600" />
                  )}
                  <p className="text-[10.5px] leading-relaxed text-[#415047]">{a.text}</p>
                </li>
              ))}
            </ul>
            <p className="mt-3 flex items-center gap-1 border-t border-[#eef0e9] pt-3 text-[9px] text-[#5f6e64]">
              <Leaf size={10} /> Generated from {test.sampledAt ? "lab data" : "regional soil grid"} and
              canopy history
            </p>
          </section>

          <Link
            href="/fields"
            className="card flex items-center justify-between p-4 transition hover:-translate-y-0.5 hover:shadow-lift"
          >
            <div>
              <p className="text-[11.5px] font-semibold">Inspect plot on the map</p>
              <p className="text-[9.5px] text-[#5b6b61]">Draw, measure or edit the boundary</p>
            </div>
            <ArrowRight size={15} className="text-canopy-700" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function HealthPage() {
  return (
    <Suspense fallback={<div className="card card-pad text-sm text-[#5b6b61]">Loading crop health…</div>}>
      <HealthView />
    </Suspense>
  );
}
