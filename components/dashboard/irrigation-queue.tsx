"use client";

import Link from "next/link";
import { ArrowRight, CalendarClock, Check, Clock3, CloudRain, Droplets } from "lucide-react";
import { useFarm } from "@/providers/farm-provider";
import { plotRecommendation } from "@/lib/data";
import { cx } from "@/lib/format";

export function IrrigationQueue() {
  const { plots, schedulePlot, scheduled } = useFarm();
  const items = plots
    .map((plot) => ({ plot, rec: plotRecommendation(plot) }))
    .filter(({ rec }) => rec.action !== "hold")
    .sort((a, b) => {
      const weight = { critical: 0, warning: 1, info: 2, ok: 3 };
      return weight[a.rec.urgency] - weight[b.rec.urgency];
    })
    .slice(0, 3);

  return (
    <section className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#eef0e9] px-5 py-4">
        <div>
          <p className="eyebrow">Decision engine</p>
          <h2 className="mt-0.5 font-display text-[16px] font-semibold tracking-[-0.02em]">
            Recommended now
          </h2>
        </div>
        <Link
          href="/irrigation"
          className="flex items-center gap-1 text-[11px] font-semibold text-canopy-700 hover:gap-1.5"
        >
          Planner <ArrowRight size={12} />
        </Link>
      </div>

      <ul className="divide-soft">
        {items.map(({ plot, rec }) => {
          const done = Boolean(scheduled[plot.id]);
          const isDelay = rec.action === "delay";
          return (
            <li key={plot.id} className="px-5 py-3.5">
              <div className="flex items-start gap-3">
                <span
                  className={cx(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    isDelay ? "bg-sky-50 text-sky-700" : rec.urgency === "critical" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700",
                  )}
                >
                  {isDelay ? <CloudRain size={15} /> : <Droplets size={15} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[12.5px] font-semibold leading-tight text-ink">
                      {isDelay ? "Delay" : "Irrigate"} · {plot.name}
                    </p>
                    <span className="shrink-0 text-[10px] font-semibold text-[#5b6b61]">
                      {isDelay ? `${rec.nextRainMm.toFixed(0)} mm rain` : `${rec.depthMm} mm`}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[10.5px] leading-relaxed text-[#5b6b61]">
                    {rec.reason}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="chip bg-sand-100 text-[#415047]">
                      <Clock3 size={10} />
                      {isDelay ? "Re-check in 24 h" : `${rec.durationMin} min`}
                    </span>
                    {!isDelay && (
                      <span className="chip bg-sand-100 text-[#415047]">
                        {rec.volumeM3} m³
                      </span>
                    )}
                    {isDelay ? (
                      <Link href={`/irrigation?plot=${plot.id}`} className="btn-secondary btn-sm ml-auto">
                        Review
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled={done}
                        onClick={() => schedulePlot(plot.id, `${plot.name} · 05:30`)}
                        className={cx("btn-sm ml-auto", done ? "btn-secondary" : "btn-primary")}
                      >
                        {done ? (
                          <>
                            <Check size={11} /> Scheduled
                          </>
                        ) : (
                          <>
                            <CalendarClock size={11} /> Schedule
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between bg-sand-50 px-5 py-2.5">
        <p className="text-[10px] text-[#5b6b61]">
          Updated from 06:00 weather run
        </p>
        <span className="flex items-center gap-1 text-[10px] font-medium text-canopy-700">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-canopy-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-canopy-600" />
          </span>
          Live
        </span>
      </div>
    </section>
  );
}
