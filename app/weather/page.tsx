import type { Metadata } from "next";
import {
  ArrowDown,
  ArrowUp,
  CloudRain,
  Droplets,
  Gauge,
  Leaf,
  Sun,
  Sunrise,
  Sunset,
  Thermometer,
  TriangleAlert,
  Waves,
  Wind,
} from "lucide-react";
import { FARM, HOURLY_TODAY, WEATHER } from "@/lib/data";
import { formatDate, formatWeekday, cx } from "@/lib/format";
import { WeatherIcon, conditionLabel, conditionTone } from "@/components/weather-icon";
import { WeatherChart } from "@/components/charts/weather-chart";

export const metadata: Metadata = {
  title: "Weather",
  description:
    "Hourly and 7-day weather for the farm: ET₀, rainfall, wind, humidity and the irrigation impact of the coming rain.",
  alternates: { canonical: "/weather" },
};

export default function WeatherPage() {
  const today = WEATHER[0];
  const rain72 = WEATHER.slice(1, 4).reduce((s, d) => s + d.precip, 0);
  const weekRain = WEATHER.reduce((s, d) => s + d.precip, 0);
  const maxEt = Math.max(...WEATHER.map((d) => d.et0 ?? 0));
  const totalEt = WEATHER.reduce((s, d) => s + (d.et0 ?? 0), 0);

  const warnings = [
    {
      key: "rain",
      title: "Rain this weekend",
      detail: `${rain72.toFixed(1)} mm through Sunday · up to 90% chance`,
      level: rain72 >= 10 ? "warning" : "info",
      icon: CloudRain,
    },
    {
      key: "wind",
      title: "Wind within limits",
      detail: "Max 3.2 m/s · safe for spraying",
      level: "ok",
      icon: Wind,
    },
    {
      key: "heat",
      title: "No heat spike",
      detail: "Highs stay below 28°C this week",
      level: "ok",
      icon: Thermometer,
    },
    {
      key: "frost",
      title: "No frost risk",
      detail: "Lows above 13°C at 1,750 m",
      level: "ok",
      icon: Leaf,
    },
  ] as const;

  return (
    <div className="space-y-5">
      {/* Current conditions */}
      <section className="relative overflow-hidden rounded-2xl border border-[#dbe6dd] bg-gradient-to-br from-[#e7f1e4] via-[#f2f6ea] to-[#e1edf3] shadow-card">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-sky-200/30 blur-3xl" />
        <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-canopy-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-canopy-500 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-canopy-600" />
              </span>
              Live · {FARM.location} · 14:20 EAT
            </p>
            <div className="mt-3 flex items-start gap-4">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/70 shadow-sm backdrop-blur">
                <WeatherIcon condition={today.condition} size={36} className="text-amber-500" />
              </span>
              <div>
                <p className="font-display text-[56px] font-semibold leading-none tracking-[-0.04em] text-ink">
                  27°
                </p>
                <p className="mt-1 text-[12px] font-medium text-[#415047]">
                  {conditionLabel(today.condition)} · feels like 28°
                </p>
              </div>
            </div>
            <p className="mt-4 max-w-md text-[12px] leading-relaxed text-[#415047]">
              A dry, breezy afternoon. Reference evapotranspiration is{" "}
              <span className="font-semibold text-ink">{(today.et0 ?? 0).toFixed(1)} mm</span> today —
              irrigate early tomorrow and let Sunday&apos;s rain do the rest.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { icon: Droplets, label: "Humidity", value: `${today.humidity}%` },
                { icon: Wind, label: "Wind", value: `${today.wind} m/s` },
                { icon: Sun, label: "Solar", value: `${today.solar} MJ` },
                { icon: Waves, label: "ET₀", value: `${today.et0} mm` },
              ].map((chip) => (
                <span
                  key={chip.label}
                  className="flex items-center gap-1.5 rounded-lg border border-white/70 bg-white/60 px-2.5 py-1.5 text-[10px] font-medium text-[#415047] backdrop-blur"
                >
                  <chip.icon size={11} className="text-canopy-600" />
                  {chip.label}
                  <span className="font-semibold text-ink">{chip.value}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/70 bg-white/65 p-4 backdrop-blur">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#5b6b61]">
                Today, hour by hour
              </p>
              <span className="text-[9px] text-[#5f6e64]">ET₀ accumulation</span>
            </div>
            <div className="mt-3 flex h-24 items-end gap-1.5">
              {HOURLY_TODAY.map((h, i) => {
                const peak = Math.max(...HOURLY_TODAY.map((x) => x.et));
                return (
                  <div key={h.time} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                    <span className="text-[8px] font-semibold text-[#415047]">{h.temp}°</span>
                    <div
                      className={cx(
                        "w-full rounded-t-md",
                        i === 0 || i >= 6 ? "bg-canopy-200" : "bg-canopy-500",
                      )}
                      style={{ height: `${Math.max(4, (h.et / peak) * 52)}px` }}
                    />
                    <span className="text-[7.5px] text-[#5f6e64]">{h.time.slice(0, 2)}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/80 pt-3 text-center">
              <div>
                <p className="flex items-center justify-center gap-1 text-[9px] text-[#5f6e64]">
                  <Sunrise size={9} /> Sunrise
                </p>
                <p className="text-[11px] font-semibold">06:12</p>
              </div>
              <div>
                <p className="flex items-center justify-center gap-1 text-[9px] text-[#5f6e64]">
                  <Sunset size={9} /> Sunset
                </p>
                <p className="text-[11px] font-semibold">18:28</p>
              </div>
              <div>
                <p className="flex items-center justify-center gap-1 text-[9px] text-[#5f6e64]">
                  <Gauge size={9} /> Day ET₀
                </p>
                <p className="text-[11px] font-semibold">{today.et0} mm</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Warnings */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {warnings.map((w) => (
          <div
            key={w.key}
            className={cx(
              "card flex items-start gap-2.5 p-4",
              w.level === "warning" && "border-amber-200 bg-amber-50/60",
            )}
          >
            <span
              className={cx(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                w.level === "warning"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-canopy-50 text-canopy-700",
              )}
            >
              <w.icon size={15} />
            </span>
            <div className="min-w-0">
              <p className="text-[11.5px] font-semibold leading-tight">{w.title}</p>
              <p className="mt-1 text-[9.5px] leading-snug text-[#5b6b61]">{w.detail}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
        {/* Forecast chart */}
        <section className="card card-pad">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="eyebrow">7-day forecast</p>
              <h2 className="mt-0.5 font-display text-[17px] font-semibold tracking-[-0.02em]">
                Temperature & rainfall
              </h2>
            </div>
            <div className="flex items-center gap-3 text-[9px] text-[#5b6b61]">
              <span className="flex items-center gap-1">
                <span className="h-[2px] w-4 bg-[#c2712f]" /> High
              </span>
              <span className="flex items-center gap-1">
                <span className="h-[2px] w-4 bg-[#2d8fbf]" /> Low
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-sm bg-sky-200" /> Rain
              </span>
            </div>
          </div>
          <div className="mt-3">
            <WeatherChart days={WEATHER} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[#eef0e9] pt-3">
            <div>
              <p className="text-[9px] uppercase tracking-wide text-[#5f6e64]">Week rainfall</p>
              <p className="mt-0.5 text-[14px] font-semibold">{weekRain.toFixed(1)} mm</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wide text-[#5f6e64]">Peak ET₀</p>
              <p className="mt-0.5 text-[14px] font-semibold">{maxEt.toFixed(1)} mm/day</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-wide text-[#5f6e64]">Cumulative ET₀</p>
              <p className="mt-0.5 text-[14px] font-semibold">{totalEt.toFixed(1)} mm</p>
            </div>
          </div>
        </section>

        {/* Field windows */}
        <section className="card card-pad">
          <p className="eyebrow">Field windows</p>
          <h2 className="mt-0.5 font-display text-[17px] font-semibold tracking-[-0.02em]">
            Best times to act
          </h2>

          <div className="mt-4 space-y-2.5">
            {[
              { time: "05:30 – 08:00", label: "Irrigate", note: "Lowest evaporation, calm wind", tone: "best" },
              { time: "08:00 – 10:30", label: "Scout / spray", note: "Dry canopy, wind under 3 m/s", tone: "good" },
              { time: "12:00 – 15:00", label: "Avoid field work", note: "Peak ET, heat stress on crew", tone: "avoid" },
              { time: "17:30 – 19:00", label: "Irrigate (second)", note: "Soil still warm, low wind", tone: "good" },
            ].map((w) => (
              <div
                key={w.time}
                className={cx(
                  "flex items-center gap-3 rounded-xl border px-3 py-2.5",
                  w.tone === "best"
                    ? "border-canopy-200 bg-canopy-50"
                    : w.tone === "avoid"
                      ? "border-red-100 bg-red-50/60"
                      : "border-[#eef0e9] bg-sand-50",
                )}
              >
                <div className="w-[86px] shrink-0">
                  <p className="text-[10px] font-semibold text-ink">{w.time}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10.5px] font-semibold">{w.label}</p>
                  <p className="text-[9px] text-[#5b6b61]">{w.note}</p>
                </div>
                <span
                  className={cx(
                    "h-1.5 w-1.5 rounded-full",
                    w.tone === "best" ? "bg-canopy-500" : w.tone === "avoid" ? "bg-red-400" : "bg-amber-400",
                  )}
                />
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-xl bg-sky-50 px-3 py-2.5">
            <TriangleAlert size={13} className="mt-0.5 shrink-0 text-sky-600" />
            <p className="text-[9.5px] leading-relaxed text-sky-900">
              Sunday&apos;s 12.8 mm event could replace two drip cycles. Re-check the water balance
              Monday morning before restarting the pump.
            </p>
          </div>

          <p className="mt-3 text-[8.5px] leading-relaxed text-[#66756a]">
            Demo dataset. Production connects to Open-Meteo&apos;s 2.5 km ensemble and refreshes every
            3 hours.
          </p>
        </section>
      </div>

      {/* Daily table */}
      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eef0e9] px-5 py-4">
          <div>
            <p className="eyebrow">Day by day</p>
            <h2 className="mt-0.5 font-display text-[16px] font-semibold tracking-[-0.02em]">
              Forecast detail
            </h2>
          </div>
          <span className="chip bg-canopy-50 text-canopy-800">
            <Gauge size={10} /> FAO-56 ET₀ computed
          </span>
        </div>

        <div className="hidden grid-cols-[1.1fr_1.2fr_0.8fr_0.9fr_0.8fr_0.7fr_0.8fr_1.2fr] gap-3 border-b border-[#eef0e9] bg-sand-50 px-5 py-2 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#5f6e64] md:grid">
          <span>Day</span>
          <span>Conditions</span>
          <span>High / low</span>
          <span>Rain</span>
          <span>Probability</span>
          <span>Wind</span>
          <span>ET₀</span>
          <span>Farm implication</span>
        </div>

        <ul className="divide-soft">
          {WEATHER.map((day) => {
            const implication =
              day.precip >= 10
                ? "Skip irrigation · recharge"
                : day.precip > 0
                  ? "Partial credit · monitor"
                  : (day.et0 ?? 0) >= 4.5
                    ? "High demand · irrigate AM"
                    : "Normal schedule";
            return (
              <li
                key={day.date}
                className="grid grid-cols-2 items-center gap-3 px-5 py-3 md:grid-cols-[1.1fr_1.2fr_0.8fr_0.9fr_0.8fr_0.7fr_0.8fr_1.2fr]"
              >
                <div>
                  <p className="text-[12px] font-semibold">
                    {formatWeekday(day.date)}
                    <span className="ml-1.5 font-normal text-[#5f6e64]">{formatDate(day.date)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <WeatherIcon condition={day.condition} size={17} className={conditionTone(day.condition)} />
                  {conditionLabel(day.condition)}
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="flex items-center gap-0.5 font-semibold">
                    <ArrowUp size={10} className="text-[#a85c22]" /> {day.tMax}°
                  </span>
                  <span className="flex items-center gap-0.5 text-[#5b6b61]">
                    <ArrowDown size={10} className="text-sky-500" /> {day.tMin}°
                  </span>
                </div>
                <span className={cx("text-[11px] font-semibold", day.precip > 0 ? "text-sky-700" : "text-[#5f6e64]")}>
                  {day.precip > 0 ? `${day.precip} mm` : "—"}
                </span>
                <span className="text-[11px] text-[#5b6b61]">{day.precipProb}%</span>
                <span className="text-[11px] text-[#5b6b61]">{day.wind} m/s</span>
                <span className="text-[11px] font-semibold">{day.et0} mm</span>
                <span
                  className={cx(
                    "w-fit chip",
                    day.precip >= 10
                      ? "bg-sky-50 text-sky-700"
                      : (day.et0 ?? 0) >= 4.5
                        ? "bg-amber-50 text-amber-800"
                        : "bg-canopy-50 text-canopy-700",
                  )}
                >
                  {implication}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
