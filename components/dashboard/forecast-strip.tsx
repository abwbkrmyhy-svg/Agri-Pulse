import Link from "next/link";
import { ArrowRight, Droplets } from "lucide-react";
import { WEATHER } from "@/lib/data";
import { formatWeekday } from "@/lib/format";
import { WeatherIcon, conditionLabel, conditionTone } from "@/components/weather-icon";
import { cx } from "@/lib/format";

export function ForecastStrip() {
  return (
    <section className="card card-pad">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">7-day outlook</p>
          <h2 className="mt-0.5 font-display text-[16px] font-semibold tracking-[-0.02em]">
            Rain is coming
          </h2>
        </div>
        <Link href="/weather" className="text-[11px] font-semibold text-canopy-700 hover:underline">
          Details
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1">
        {WEATHER.map((day, i) => (
          <div
            key={day.date}
            className={cx(
              "flex flex-col items-center rounded-xl px-1 py-2.5 text-center",
              i === 0 ? "bg-canopy-800 text-white" : "bg-sand-50",
            )}
          >
            <p className={cx("text-[9px] font-semibold uppercase tracking-wide", i === 0 ? "text-canopy-200" : "text-[#5f6e64]")}>
              {formatWeekday(day.date)}
            </p>
            <WeatherIcon
              condition={day.condition}
              size={18}
              className={cx("my-2", i === 0 ? "text-lime-400" : conditionTone(day.condition))}
            />
            <p className={cx("text-[12px] font-semibold leading-none", i === 0 ? "text-white" : "text-ink")}>
              {day.tMax}°
            </p>
            <p className={cx("mt-1 text-[9px]", i === 0 ? "text-canopy-300" : "text-[#5f6e64]")}>
              {day.tMin}°
            </p>
            <span
              className={cx(
                "mt-1.5 flex items-center gap-0.5 text-[8.5px] font-semibold",
                i === 0 ? "text-sky-200" : day.precip > 0 ? "text-sky-700" : "text-[#66756a]",
              )}
            >
              <Droplets size={8} />
              {day.precipProb}%
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-xl bg-sky-50 px-3 py-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-sky-600">
          <WeatherIcon condition="rain" size={15} />
        </span>
        <p className="flex-1 text-[10.5px] leading-snug text-sky-900">
          <span className="font-semibold">12.8 mm</span> expected Sunday — enough to skip
          two irrigation cycles.
        </p>
        <ArrowRight size={13} className="text-sky-500" />
      </div>

      <p className="mt-2.5 text-[9px] text-[#66756a]">
        {conditionLabel(WEATHER[0].condition)} · Open-Meteo model, 2.5 km grid
      </p>
    </section>
  );
}
