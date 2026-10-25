"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CloudRain,
  Droplets,
  MapPin,
  Satellite,
  Sprout,
  TriangleAlert,
  Waves,
} from "lucide-react";
import { useFarm } from "@/providers/farm-provider";
import { ALERTS, FARM, WEATHER, plotRecommendation, plotStatus } from "@/lib/data";
import { moisturePct, formatDateLong } from "@/lib/format";
import { SOIL_WATER } from "@/lib/crops";
import { StatCard } from "@/components/stat-card";
import { PlotCard } from "@/components/plot-card";
import { BalancePanel } from "@/components/dashboard/balance-panel";
import { IrrigationQueue } from "@/components/dashboard/irrigation-queue";
import { TaskList } from "@/components/dashboard/task-list";
import { ForecastStrip } from "@/components/dashboard/forecast-strip";
import { WeatherIcon, conditionLabel } from "@/components/weather-icon";

export default function DashboardPage() {
  const { plots } = useFarm();
  const totalArea = plots.reduce((sum, p) => sum + p.areaHa, 0);
  const avgUsable = Math.round(
    plots.reduce((sum, p) => {
      const soil = SOIL_WATER[p.soil];
      return sum + moisturePct(p.moisture, soil.wiltingPoint, soil.fieldCapacity);
    }, 0) / Math.max(plots.length, 1),
  );
  const needy = plots.filter((p) => plotStatus(p) !== "optimal");
  const next = plots
    .map((p) => ({ p, rec: plotRecommendation(p) }))
    .filter((x) => x.rec.action === "irrigate")
    .sort((a, b) => {
      const w = { critical: 0, warning: 1, info: 2, ok: 3 };
      return w[a.rec.urgency] - w[b.rec.urgency];
    })[0];

  const today = WEATHER[0];

  return (
    <div className="space-y-5">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-canopy-950 text-white shadow-lift">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #9ed44b 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-lime-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-canopy-500/25 blur-3xl" />

        <div className="relative flex flex-col gap-6 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-lime-400">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-400" />
              {formatDateLong("2026-10-22")} · {FARM.location}
            </p>
            <h2 className="mt-2.5 font-display text-[26px] font-semibold leading-[1.12] tracking-[-0.03em] sm:text-[32px]">
              Good morning, Amina.
              <br />
              <span className="text-canopy-200">
                {needy.length} plots need a decision today.
              </span>
            </h2>
            <p className="mt-3 max-w-md text-[12px] leading-relaxed text-canopy-200">
              {next
                ? `${next.p.name} is ${Math.round((next.rec.depletionMm / next.rec.taw) * 100)}% depleted. The model recommends ${next.rec.depthMm} mm early tomorrow, before the heat.`
                : "All plots are inside their comfort band. Keep the current schedule."}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link href="/irrigation" className="btn bg-lime-400 text-canopy-950 hover:bg-lime-500">
                <Droplets size={15} /> Review irrigation
              </Link>
              <Link
                href="/fields"
                className="btn border border-white/15 bg-white/5 text-white hover:bg-white/10"
              >
                <MapPin size={15} /> Open field map
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row lg:flex-col">
            <div className="flex w-full flex-1 items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3.5 backdrop-blur-sm lg:min-w-[230px]">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                <WeatherIcon condition={today.condition} size={26} className="text-amber-300" />
              </span>
              <div className="min-w-0">
                <p className="font-display text-[28px] font-semibold leading-none tracking-tight">
                  {today.tMax}°
                </p>
                <p className="mt-1 truncate text-[10px] text-canopy-200">
                  {conditionLabel(today.condition)} · {today.humidity}% RH
                </p>
                <p className="text-[10px] text-canopy-300">
                  ET₀ {today.et0?.toFixed(1)} mm today
                </p>
              </div>
            </div>
            <div className="grid flex-1 grid-cols-2 gap-2.5">
              <div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5">
                <p className="text-[9px] uppercase tracking-wider text-canopy-300">Wind</p>
                <p className="mt-0.5 text-[13px] font-semibold">{today.wind} m/s</p>
              </div>
              <div className="min-w-0 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5">
                <p className="text-[9px] uppercase tracking-wider text-canopy-300">Rain 48 h</p>
                <p className="mt-0.5 text-[13px] font-semibold">
                  {(WEATHER[1].precip + WEATHER[2].precip).toFixed(1)} mm
                </p>
              </div>
            </div>
          </div>
        </div>

        <Link
          href="/weather"
          className="relative flex items-center gap-2.5 border-t border-white/10 bg-amber-400/[0.12] px-5 py-2.5 text-[11px] font-medium text-amber-100 transition hover:bg-amber-400/20 sm:px-7"
        >
          <CloudRain size={14} className="shrink-0 text-amber-300" />
          <span className="flex-1">
            <span className="font-semibold text-amber-200">Rain Sunday:</span> 12.8 mm
            forecast — two irrigation cycles can be skipped.
          </span>
          <ArrowRight size={13} className="shrink-0" />
        </Link>
      </section>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Usable soil water"
          value={avgUsable}
          unit="%"
          icon={Waves}
          tone="green"
          delta={6}
          deltaLabel="Across all plots vs. last week"
        />
        <StatCard
          label="Water saved this season"
          value="1,284"
          unit="m³"
          icon={Droplets}
          tone="blue"
          delta={24}
          deltaLabel="24% below the 5-year baseline"
        />
        <StatCard
          label="Next irrigation window"
          value="05:30"
          unit="tomorrow"
          icon={Sprout}
          tone={next?.rec.urgency === "critical" ? "red" : "amber"}
          sub={next ? `${next.p.name} · ${next.rec.depthMm} mm` : "No action required"}
        />
        <StatCard
          label="Active alerts"
          value={ALERTS.filter((a) => a.severity !== "info").length}
          icon={TriangleAlert}
          tone="red"
          sub={`${ALERTS.length} total · 1 NDVI anomaly`}
        />
      </div>

      {/* Main grid */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,1fr)]">
        <div className="space-y-5">
          <section>
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="eyebrow">Crop status</p>
                <h2 className="mt-0.5 font-display text-[18px] font-semibold tracking-[-0.02em]">
                  Field by field
                </h2>
              </div>
              <Link
                href="/fields"
                aria-label={`View all ${plots.length} fields, ${totalArea.toFixed(1)} hectares`}
                className="flex items-center gap-1 text-[11px] font-semibold text-canopy-700 hover:gap-1.5"
              >
                <span className="hidden sm:inline">
                  {plots.length} plots · {totalArea.toFixed(1)} ha
                </span>
                <ArrowRight size={12} aria-hidden="true" />
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {plots.slice(0, 4).map((plot) => (
                <PlotCard key={plot.id} plot={plot} compact />
              ))}
            </div>
          </section>

          <BalancePanel />
        </div>

        <div className="space-y-5">
          <IrrigationQueue />
          <ForecastStrip />
          <TaskList />
        </div>
      </div>

      {/* Footer insight */}
      <section className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-canopy-50 text-canopy-700">
          <Satellite size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold">Sentinel-2 scene captured yesterday</p>
          <p className="mt-0.5 text-[10.5px] text-[#5b6b61]">
            NDVI refreshed for 5 plots at 10 m resolution. East Wheat shows a 0.07 week-over-week dip.
          </p>
        </div>
        <Link href="/health" className="btn-secondary btn-sm shrink-0">
          Inspect NDVI <ArrowUpRight size={12} />
        </Link>
      </section>
    </div>
  );
}
