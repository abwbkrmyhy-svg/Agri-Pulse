"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Droplets, Gauge, Waves } from "lucide-react";
import { useFarm } from "@/providers/farm-provider";
import { WEATHER, cropFor, plotStage } from "@/lib/data";
import { totalAvailableWaterMm } from "@/lib/et";
import { waterBalanceFor } from "@/lib/balance";
import { WaterBalanceChart, WaterBalanceLegend } from "@/components/charts/water-balance-chart";
import { formatNumber } from "@/lib/format";

export function BalancePanel() {
  const { plots } = useFarm();
  const [selected, setSelected] = useState(plots[0]?.id ?? "");
  const plot = plots.find((p) => p.id === selected) ?? plots[0];

  const points = useMemo(() => {
    if (!plot) return [];
    return waterBalanceFor(plot, WEATHER);
  }, [plot]);

  if (!plot) return null;

  const crop = cropFor(plot);
  const stage = plotStage(plot);
  const taw = totalAvailableWaterMm(plot);
  const today = points[0];
  const refill = today?.raw ?? 0;
  const depletion = today?.depletionMm ?? 0;

  return (
    <section className="card card-pad">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Water balance · next 7 days</p>
          <h2 className="mt-1 font-display text-[17px] font-semibold tracking-[-0.02em]">
            Root-zone depletion
          </h2>
        </div>
        <div className="relative">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="appearance-none rounded-xl border border-[#d9dfd5] bg-white py-2 pl-3 pr-8 text-[11px] font-semibold text-ink focus:border-canopy-500 focus:outline-none focus:ring-2 focus:ring-canopy-200"
            aria-label="Select plot"
          >
            {plots.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={13}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5b6b61]"
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-sand-50 px-3 py-2.5">
          <p className="flex items-center gap-1 text-[9px] uppercase tracking-[0.1em] text-[#5f6e64]">
            <Droplets size={10} /> Depleted
          </p>
          <p className="mt-1 font-display text-[16px] font-semibold leading-none">
            {depletion.toFixed(1)}
            <span className="ml-0.5 text-[10px] font-medium text-[#5b6b61]">mm</span>
          </p>
        </div>
        <div className="rounded-xl bg-sand-50 px-3 py-2.5">
          <p className="flex items-center gap-1 text-[9px] uppercase tracking-[0.1em] text-[#5f6e64]">
            <Waves size={10} /> Refill at
          </p>
          <p className="mt-1 font-display text-[16px] font-semibold leading-none">
            {refill.toFixed(1)}
            <span className="ml-0.5 text-[10px] font-medium text-[#5b6b61]">mm</span>
          </p>
        </div>
        <div className="rounded-xl bg-sand-50 px-3 py-2.5">
          <p className="flex items-center gap-1 text-[9px] uppercase tracking-[0.1em] text-[#5f6e64]">
            <Gauge size={10} /> Capacity
          </p>
          <p className="mt-1 font-display text-[16px] font-semibold leading-none">
            {formatNumber(taw)}
            <span className="ml-0.5 text-[10px] font-medium text-[#5b6b61]">mm</span>
          </p>
        </div>
      </div>

      <div className="mt-4">
        <WaterBalanceChart points={points} />
        <WaterBalanceLegend />
      </div>

      <p className="mt-3 rounded-lg bg-canopy-50 px-3 py-2 text-[10.5px] leading-relaxed text-canopy-800">
        <span className="font-semibold">{crop.label}, {stage.label.toLowerCase()}.</span>{" "}
        {plot.areaHa.toFixed(2)} ha of {plot.soil.toLowerCase()} holds {formatNumber(taw)} mm of
        plant-available water. Irrigation refills the profile once depletion crosses{" "}
        {refill.toFixed(0)} mm.
      </p>
    </section>
  );
}
