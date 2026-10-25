"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  Check,
  ChevronRight,
  CloudRain,
  Droplets,
  Gauge,
  Info,
  SlidersHorizontal,
  Sprout,
  Timer,
  Waves,
  Wind,
} from "lucide-react";
import { useFarm } from "@/providers/farm-provider";
import {
  DEMO_TODAY,
  WEATHER,
  cropFor,
  plotDay,
  plotRecommendation,
  plotStage,
  plotStatus,
} from "@/lib/data";
import {
  totalAvailableWaterMm,
  adjustedP,
  recommendIrrigation,
  statusFromMoisture,
} from "@/lib/et";
import { waterBalanceFor } from "@/lib/balance";
import { SOIL_WATER } from "@/lib/crops";
import { WaterBalanceChart, WaterBalanceLegend } from "@/components/charts/water-balance-chart";
import { MoistureRing } from "@/components/moisture-ring";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatNumber, moisturePct, cx } from "@/lib/format";
import type { Plot } from "@/lib/types";

function Planner() {
  const params = useSearchParams();
  const { plots, scheduled, schedulePlot, notify } = useFarm();

  const initial =
    plots.find((p) => p.id === params.get("plot")) ??
    plots.find((p) => plotStatus(p) === "critical") ??
    plots[0];

  const [selectedId, setSelectedId] = useState(initial?.id ?? "");
  const plot = plots.find((p) => p.id === selectedId) ?? plots[0];

  const [rate, setRate] = useState(plot?.applicationRate || 4);
  const [eff, setEff] = useState(Math.round((plot?.irrigationEfficiency ?? 0.85) * 100));
  const [rainCredit, setRainCredit] = useState(0);

  useEffect(() => {
    const next = plots.find((p) => p.id === selectedId) ?? plots[0];
    if (!next) return;
    setRate(next.applicationRate || 4);
    setEff(Math.round(next.irrigationEfficiency * 100));
    setRainCredit(0);
  }, [selectedId, plots]);

  const crop = plot ? cropFor(plot) : null;
  const stage = plot ? plotStage(plot) : null;
  const points = useMemo(() => (plot ? waterBalanceFor(plot) : []), [plot]);
  const today = points[0];

  const tuned: Plot | null = plot
    ? {
        ...plot,
        applicationRate: rate,
        irrigationEfficiency: eff / 100,
      }
    : null;

  const rec = tuned && crop ? recommendIrrigation(tuned, crop, WEATHER, stage!.kc) : null;

  if (!plot || !crop || !stage || !rec || !today) {
    return (
      <p className="card card-pad text-sm text-[#5b6b61]">
        Add a plot to start planning irrigation.
      </p>
    );
  }

  const soil = SOIL_WATER[plot.soil];
  const usable = moisturePct(plot.moisture, soil.wiltingPoint, soil.fieldCapacity);
  const taw = totalAvailableWaterMm(plot);
  const raw = adjustedP(crop.depletionFraction, (WEATHER[0].et0 ?? 0) * stage.kc) * taw;
  const etcToday = (WEATHER[0].et0 ?? 0) * stage.kc;
  const gross = Math.max(0, rec.grossMm - rainCredit);
  const runtime = rate > 0 ? Math.round((gross / rate) * 60) : 0;
  const volume = Math.round(gross * plot.areaHa * 10);
  const energy = Math.round((volume * 9.81 * 12) / 3600 / 0.55);
  const scheduledLabel = scheduled[plot.id];

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Reference ET₀ today", value: (WEATHER[0].et0 ?? 0).toFixed(2), unit: "mm", icon: Wind, note: "FAO-56 Penman–Monteith" },
          { label: "Crop water demand", value: etcToday.toFixed(1), unit: "mm", icon: Sprout, note: `${crop.label} · Kc ${stage.kc}` },
          { label: "Refill threshold", value: raw.toFixed(0), unit: "mm", icon: Gauge, note: `${Math.round((raw / taw) * 100)}% of ${taw.toFixed(0)} mm TAW` },
          { label: "Rain next 48 h", value: (WEATHER[1].precip + WEATHER[2].precip).toFixed(1), unit: "mm", icon: CloudRain, note: "Below the 10 mm hold threshold" },
        ].map((kpi) => (
          <div key={kpi.label} className="card card-pad">
            <div className="flex items-start justify-between">
              <p className="eyebrow">{kpi.label}</p>
              <kpi.icon size={14} className="text-canopy-600" />
            </div>
            <p className="mt-2 font-display text-[24px] font-semibold leading-none">
              {kpi.value}
              <span className="ml-1 text-[11px] font-medium text-[#5b6b61]">{kpi.unit}</span>
            </p>
            <p className="mt-1.5 text-[10px] text-[#5f6e64]">{kpi.note}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,1fr)]">
        <div className="space-y-5">
          {/* Plan card */}
          <section className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eef0e9] px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-[17px]"
                  style={{ backgroundColor: `${plot.color}18` }}
                >
                  {crop.emoji}
                </span>
                <div>
                  <h2 className="text-[14px] font-semibold leading-tight">{plot.name}</h2>
                  <p className="text-[10px] text-[#5b6b61]">
                    {crop.label} · {stage.label} · day {plotDay(plot)} of {crop.cycleDays}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={plotStatus(plot)} />
                <span className="chip bg-sand-100 text-[#415047]">{plot.system}</span>
              </div>
            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-[auto_1fr]">
              <div className="flex flex-col items-center gap-2">
                <MoistureRing value={usable} status={plotStatus(plot)} size={112} />
                <p className="text-center text-[9px] leading-tight text-[#5f6e64]">
                  Usable water<br />
                  <span className="font-semibold text-[#5b6b61]">{plot.moisture}% VWC</span>
                </p>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cx(
                      "chip ring-1 ring-inset",
                      rec.action === "irrigate"
                        ? rec.urgency === "critical"
                          ? "bg-red-50 text-red-700 ring-red-200"
                          : "bg-amber-50 text-amber-800 ring-amber-200"
                        : "bg-sky-50 text-sky-700 ring-sky-200",
                    )}
                  >
                    {rec.action === "irrigate" ? <Droplets size={11} /> : <CloudRain size={11} />}
                    {rec.action === "irrigate"
                      ? rec.urgency === "critical"
                        ? "Irrigate now"
                        : "Irrigate tomorrow"
                      : "Hold irrigation"}
                  </span>
                  <span className="text-[10px] text-[#5f6e64]">
                    Model run {formatDate(DEMO_TODAY)} · 06:00
                  </span>
                </div>

                <h3 className="mt-2 font-display text-[22px] font-semibold leading-tight tracking-[-0.02em] sm:text-[25px]">
                  {rec.action === "irrigate"
                    ? `Apply ${Math.max(0, Math.round((rec.depthMm - rainCredit) * 10) / 10)} mm`
                    : rec.action === "delay"
                      ? "Wait for the rain"
                      : "No water needed"}
                </h3>
                <p className="mt-1.5 max-w-xl text-[11.5px] leading-relaxed text-[#5b6b61]">
                  {rec.reason}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { label: "Net depth", value: `${Math.round(rec.depthMm * 10) / 10} mm`, icon: Droplets },
                    { label: "Runtime", value: runtime ? `${runtime} min` : "—", icon: Timer },
                    { label: "Volume", value: volume ? `${volume} m³` : "—", icon: Waves },
                    { label: "Energy", value: energy ? `${energy} kWh` : "—", icon: Gauge },
                  ].map((m) => (
                    <div key={m.label} className="rounded-xl bg-sand-50 px-3 py-2.5">
                      <p className="flex items-center gap-1 text-[8.5px] uppercase tracking-[0.08em] text-[#5f6e64]">
                        <m.icon size={9} /> {m.label}
                      </p>
                      <p className="mt-0.5 text-[13px] font-semibold text-ink">{m.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={Boolean(scheduledLabel)}
                    onClick={() =>
                      schedulePlot(
                        plot.id,
                        `${plot.name} · ${formatDate("2026-10-23")} 05:30 · ${Math.max(0, Math.round(rec.depthMm - rainCredit))} mm`,
                      )
                    }
                    className={scheduledLabel ? "btn-secondary" : "btn-primary"}
                  >
                    {scheduledLabel ? (
                      <>
                        <Check size={14} /> Scheduled
                      </>
                    ) : (
                      <>
                        <CalendarClock size={14} /> Schedule for 05:30
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => notify(`Applied ${Math.max(0, rec.depthMm - rainCredit)} mm to ${plot.name} — water log updated`, "info")}
                    className="btn-secondary"
                  >
                    <Check size={14} /> Log as applied
                  </button>
                  <Link
                    href={`/health?plot=${plot.id}`}
                    className="btn-ghost btn-sm ml-auto hidden sm:inline-flex"
                  >
                    Crop health <ArrowRight size={12} />
                  </Link>
                </div>

                {scheduledLabel && (
                  <p className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-canopy-50 px-2.5 py-2 text-[10.5px] font-medium text-canopy-800">
                    <CalendarClock size={12} /> {scheduledLabel}
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-[#eef0e9] bg-sand-50 px-5 py-3">
              <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-[#5b6b61]">
                <Info size={12} className="mt-0.5 shrink-0 text-canopy-600" />
                {rec.action === "irrigate"
                  ? `Gross application is ${rec.grossMm} mm at ${Math.round(plot.irrigationEfficiency * 100)}% efficiency. Irrigate before 09:00 or after 17:00 to limit evaporation losses.`
                  : `Re-check after the ${formatDate(WEATHER[2].date)} weather run. A further ${(10 - rec.nextRainMm).toFixed(0)} mm of rain would refill the profile without pumping.`}
              </p>
            </div>
          </section>

          {/* Balance chart */}
          <section className="card card-pad">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="eyebrow">FAO-56 water balance</p>
                <h2 className="mt-0.5 font-display text-[17px] font-semibold tracking-[-0.02em]">
                  Seven-day root-zone forecast
                </h2>
              </div>
              <span className="chip bg-canopy-50 text-canopy-800">
                Ks {today.ks.toFixed(2)} · {today.stress ? "stress" : "no stress"}
              </span>
            </div>
            <div className="mt-4">
              <WaterBalanceChart points={points} />
              <WaterBalanceLegend />
            </div>
          </section>

          {/* Calculator */}
          <section className="card card-pad">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-canopy-50 text-canopy-700">
                <SlidersHorizontal size={15} />
              </span>
              <div>
                <p className="eyebrow">Application calculator</p>
                <h2 className="font-display text-[16px] font-semibold tracking-[-0.02em]">
                  Tune the system
                </h2>
              </div>
            </div>

            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label htmlFor="rate" className="text-[11px] font-semibold text-[#415047]">
                      Application rate
                    </label>
                    <span className="text-[11px] font-semibold text-ink">{rate.toFixed(1)} mm/h</span>
                  </div>
                  <input
                    id="rate"
                    type="range"
                    min={0.5}
                    max={15}
                    step={0.1}
                    value={rate}
                    onChange={(e) => setRate(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="mt-1 flex justify-between text-[9px] text-[#5f6e64]">
                    <span>Drip</span><span>Pivot</span><span>Sprinkler</span>
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label htmlFor="eff" className="text-[11px] font-semibold text-[#415047]">
                      Application efficiency
                    </label>
                    <span className="text-[11px] font-semibold text-ink">{eff}%</span>
                  </div>
                  <input
                    id="eff"
                    type="range"
                    min={50}
                    max={98}
                    step={1}
                    value={eff}
                    onChange={(e) => setEff(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="mt-1 flex justify-between text-[9px] text-[#5f6e64]">
                    <span>Flood 50%</span><span>Pivot 80%</span><span>Drip 95%</span>
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label htmlFor="credit" className="text-[11px] font-semibold text-[#415047]">
                      Expected rain credit
                    </label>
                    <span className="text-[11px] font-semibold text-ink">{rainCredit.toFixed(1)} mm</span>
                  </div>
                  <input
                    id="credit"
                    type="range"
                    min={0}
                    max={15}
                    step={0.5}
                    value={rainCredit}
                    onChange={(e) => setRainCredit(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 self-start rounded-2xl bg-canopy-950 p-4 text-white">
                <div className="col-span-2">
                  <p className="text-[9px] uppercase tracking-[0.12em] text-canopy-300">Adjusted runtime</p>
                  <p className="mt-1 font-display text-[26px] font-semibold leading-none">
                    {runtime}
                    <span className="ml-1 text-[11px] font-medium text-canopy-300">min</span>
                  </p>
                </div>
                <div className="rounded-lg bg-white/5 px-2.5 py-2">
                  <p className="text-[8px] uppercase tracking-wide text-canopy-300">Gross depth</p>
                  <p className="mt-0.5 text-[13px] font-semibold">{gross.toFixed(1)} mm</p>
                </div>
                <div className="rounded-lg bg-white/5 px-2.5 py-2">
                  <p className="text-[8px] uppercase tracking-wide text-canopy-300">Volume</p>
                  <p className="mt-0.5 text-[13px] font-semibold">{volume} m³</p>
                </div>
                <div className="rounded-lg bg-white/5 px-2.5 py-2">
                  <p className="text-[8px] uppercase tracking-wide text-canopy-300">Pump energy</p>
                  <p className="mt-0.5 text-[13px] font-semibold">{energy} kWh</p>
                </div>
                <div className="rounded-lg bg-white/5 px-2.5 py-2">
                  <p className="text-[8px] uppercase tracking-wide text-canopy-300">Window</p>
                  <p className="mt-0.5 text-[13px] font-semibold">05:30–08:00</p>
                </div>
                <p className="col-span-2 text-[9px] leading-relaxed text-canopy-300">
                  Efficiency is applied to convert net crop demand into gross pumping volume.
                  Energy assumes a 12 m total head at 55% pump efficiency.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Right rail */}
        <div className="space-y-5">
          <section className="card overflow-hidden">
            <div className="border-b border-[#eef0e9] px-5 py-4">
              <p className="eyebrow">Plots</p>
              <h2 className="mt-0.5 font-display text-[16px] font-semibold tracking-[-0.02em]">
                Switch field
              </h2>
            </div>
            <ul className="divide-soft">
              {plots.map((p) => {
                const s = SOIL_WATER[p.soil];
                const u = moisturePct(p.moisture, s.wiltingPoint, s.fieldCapacity);
                const status = statusFromMoisture(p.moisture, p.soil);
                const active = p.id === selectedId;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(p.id)}
                      className={cx(
                        "flex w-full items-center gap-3 px-5 py-3 text-left transition",
                        active ? "bg-canopy-50" : "hover:bg-sand-50",
                      )}
                    >
                      <span
                        className={cx(
                          "h-2 w-2 shrink-0 rounded-full",
                          status === "optimal" ? "bg-canopy-500" : status === "attention" ? "bg-amber-500" : "bg-red-500",
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-semibold">{p.name}</p>
                        <p className="text-[10px] text-[#5b6b61]">
                          {cropFor(p).label} · {p.areaHa.toFixed(2)} ha
                        </p>
                      </div>
                      <div className="w-16">
                        <div className="h-1.5 overflow-hidden rounded-full bg-[#eef0e9]">
                          <div
                            className={cx(
                              "h-full rounded-full",
                              status === "optimal" ? "bg-canopy-500" : status === "attention" ? "bg-amber-500" : "bg-red-500",
                            )}
                            style={{ width: `${u}%` }}
                          />
                        </div>
                        <p className="mt-0.5 text-right text-[9px] font-medium text-[#5f6e64]">{u}%</p>
                      </div>
                      <ChevronRight size={13} className={active ? "text-canopy-700" : "text-[#c3ccbf]"} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="card card-pad">
            <p className="eyebrow">Crop coefficient</p>
            <div className="mt-2 flex items-end justify-between">
              <div>
                <p className="font-display text-[28px] font-semibold leading-none">{stage.kc.toFixed(2)}</p>
                <p className="mt-1 text-[10px] text-[#5b6b61]">Kc · {stage.label}</p>
              </div>
              <span className="chip bg-canopy-50 text-canopy-800">{crop.label}</span>
            </div>
            <div className="mt-3 flex gap-1">
              {crop.stages.map((s) => (
                <div key={s.key} className="flex-1">
                  <div
                    className={cx(
                      "h-1.5 rounded-full",
                      s.key === stage.key ? "bg-canopy-600" : "bg-[#e3e6dd]",
                    )}
                  />
                  <p className={cx("mt-1 truncate text-[8px]", s.key === stage.key ? "font-semibold text-canopy-800" : "text-[#5f6e64]")}>
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
            <dl className="mt-4 space-y-2 border-t border-[#eef0e9] pt-3 text-[10.5px]">
              <div className="flex justify-between">
                <dt className="text-[#5b6b61]">Root depth</dt>
                <dd className="font-semibold">{plot.rootDepthM.toFixed(2)} m</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#5b6b61]">Depletion fraction (p)</dt>
                <dd className="font-semibold">{crop.depletionFraction.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#5b6b61]">Soil water capacity</dt>
                <dd className="font-semibold">{formatNumber(taw)} mm</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#5b6b61]">NDVI (Sentinel-2)</dt>
                <dd className="font-semibold">{plot.ndvi.toFixed(2)}</dd>
              </div>
            </dl>
          </section>

          <section className="card card-pad">
            <p className="eyebrow">Why this matters</p>
            <p className="mt-2 text-[11px] leading-relaxed text-[#5b6b61]">
              The engine couples the FAO-56 Penman–Monteith reference ET with a daily depletion
              balance. Water stress starts once depletion passes the readily available water
              threshold, which is when the recommendation asks for a refill.
            </p>
            <div className="mt-3 rounded-xl bg-sand-50 px-3 py-2.5 font-mono text-[9.5px] leading-relaxed text-[#415047]">
              ET₀ = f(Rn, T, u₂, VPD)<br />
              ETc = ET₀ × Kc × Ks<br />
              Dr,i = Dr,i−1 − P − I + ETc
            </div>
          </section>
        </div>
      </div>

      {/* Schedule table */}
      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eef0e9] px-5 py-4">
          <div>
            <p className="eyebrow">Week ahead</p>
            <h2 className="mt-0.5 font-display text-[16px] font-semibold tracking-[-0.02em]">
              Irrigation queue
            </h2>
          </div>
          <Link href="/weather" className="text-[11px] font-semibold text-canopy-700 hover:underline">
            Check forecast
          </Link>
        </div>
        <div className="hidden grid-cols-[1.3fr_0.9fr_0.8fr_0.8fr_0.8fr_1fr_auto] gap-3 border-b border-[#eef0e9] bg-sand-50 px-5 py-2 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#5f6e64] md:grid">
          <span>Plot</span>
          <span>Decision</span>
          <span>Net depth</span>
          <span>Runtime</span>
          <span>Volume</span>
          <span>Window</span>
          <span />
        </div>
        <ul className="divide-soft">
          {plots.map((p) => {
            const r = plotRecommendation(p);
            const isScheduled = Boolean(scheduled[p.id]);
            return (
              <li key={p.id} className="grid grid-cols-2 items-center gap-3 px-5 py-3 md:grid-cols-[1.3fr_0.9fr_0.8fr_0.8fr_0.8fr_1fr_auto]">
                <div className="col-span-2 md:col-span-1">
                  <p className="text-[12px] font-semibold">{p.name}</p>
                  <p className="text-[10px] text-[#5b6b61]">{cropFor(p).label} · {p.areaHa.toFixed(2)} ha</p>
                </div>
                <span
                  className={cx(
                    "w-fit chip",
                    r.action === "hold"
                      ? "bg-canopy-50 text-canopy-700"
                      : r.action === "delay"
                        ? "bg-sky-50 text-sky-700"
                        : r.urgency === "critical"
                          ? "bg-red-50 text-red-700"
                          : "bg-amber-50 text-amber-800",
                  )}
                >
                  {r.action === "hold" ? "Hold" : r.action === "delay" ? "Delay" : "Irrigate"}
                </span>
                <span className="text-[11px] font-semibold">{r.depthMm ? `${r.depthMm} mm` : "—"}</span>
                <span className="text-[11px]">{r.durationMin ? `${r.durationMin} min` : "—"}</span>
                <span className="text-[11px]">{r.volumeM3 ? `${r.volumeM3} m³` : "—"}</span>
                <span className="text-[10.5px] text-[#5b6b61]">
                  {r.action === "irrigate" ? `${formatDate("2026-10-23")} · 05:30` : r.action === "delay" ? "After rain" : "—"}
                </span>
                <div className="justify-self-end">
                  {r.action === "irrigate" ? (
                    <button
                      type="button"
                      disabled={isScheduled}
                      onClick={() => schedulePlot(p.id, `${p.name} · 23 Oct 05:30 · ${r.depthMm} mm`)}
                      className={cx("btn-sm", isScheduled ? "btn-secondary" : "btn-primary")}
                    >
                      {isScheduled ? <Check size={11} /> : <CalendarClock size={11} />}
                      {isScheduled ? "Set" : "Schedule"}
                    </button>
                  ) : (
                    <span className="text-[9px] text-[#5f6e64]">{r.action === "delay" ? "Rain" : "OK"}</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <p className="border-t border-[#eef0e9] bg-sand-50 px-5 py-2.5 text-[9.5px] text-[#5f6e64]">
          Depths are net crop demand. Runtime and volume use each plot&apos;s configured application
          rate and efficiency. Dates are model windows, not confirmed pump schedules.
        </p>
      </section>
    </div>
  );
}

export default function IrrigationPage() {
  return (
    <Suspense
      fallback={
        <div className="card card-pad text-sm text-[#5b6b61]">Loading irrigation planner…</div>
      }
    >
      <Planner />
    </Suspense>
  );
}
