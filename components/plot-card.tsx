import Link from "next/link";
import { ArrowRight, Droplets, Satellite } from "lucide-react";
import { cropFor, plotDay, plotStage, plotStatus } from "@/lib/data";
import { SOIL_WATER } from "@/lib/crops";
import { moisturePct, formatArea } from "@/lib/format";
import type { Plot } from "@/lib/types";
import { MoistureRing } from "@/components/moisture-ring";
import { StatusBadge } from "@/components/status-badge";

export function PlotCard({ plot, compact = false }: { plot: Plot; compact?: boolean }) {
  const crop = cropFor(plot);
  const stage = plotStage(plot);
  const status = plotStatus(plot);
  const soil = SOIL_WATER[plot.soil];
  const usable = moisturePct(plot.moisture, soil.wiltingPoint, soil.fieldCapacity);
  const day = plotDay(plot);

  return (
    <Link
      href={`/irrigation?plot=${plot.id}`}
      className="group card flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="flex items-start gap-3 p-4 pb-3">
        <span
          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[18px]"
          style={{ backgroundColor: `${plot.color}18` }}
        >
          {crop.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-semibold leading-tight text-ink">
                {plot.name}
              </p>
              <p className="mt-0.5 truncate text-[10.5px] text-[#5b6b61]">
                {crop.label} · {plot.variety}
              </p>
            </div>
            <StatusBadge status={status} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-[#5b6b61]">
            <span className="font-semibold text-ink">{formatArea(plot.areaHa)}</span>
            <span aria-hidden="true" className="text-[#9aa89d]">·</span>
            <span>{plot.soil}</span>
            <span aria-hidden="true" className="text-[#9aa89d]">·</span>
            <span>Day {day}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 px-4 pb-4">
        <MoistureRing value={usable} status={status} size={compact ? 64 : 72} />
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-medium text-[#5b6b61]">Growth stage</span>
              <span className="font-semibold text-ink">{stage.label}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#eef0e9]">
              <div
                className="h-full rounded-full bg-canopy-500"
                style={{ width: `${Math.min(100, (day / crop.cycleDays) * 100)}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-sand-50 px-2 py-1.5">
              <p className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-[#5f6e64]">
                <Droplets size={9} /> Depletion
              </p>
              <p className="mt-0.5 text-[11px] font-semibold text-ink">
                {Math.round((1 - usable / 100) * 100)}% of TAW
              </p>
            </div>
            <div className="rounded-lg bg-sand-50 px-2 py-1.5">
              <p className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-[#5f6e64]">
                <Satellite size={9} /> NDVI
              </p>
              <p className="mt-0.5 text-[11px] font-semibold text-ink">
                {plot.ndvi.toFixed(2)}
                <span className="ml-1 text-[9px] font-medium text-canopy-600">healthy</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-[#eef0e9] px-4 py-2.5">
        <span className="text-[10px] text-[#5b6b61]">
          {plot.system} · {plot.applicationRate} mm/h
        </span>
        <span className="flex items-center gap-1 text-[10px] font-semibold text-canopy-700 transition group-hover:gap-1.5">
          Open plan <ArrowRight size={12} />
        </span>
      </div>
    </Link>
  );
}
