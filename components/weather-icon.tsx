import {
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSun,
  Sun,
} from "lucide-react";
import type { WeatherDay } from "@/lib/types";
import { cx } from "@/lib/format";

export function WeatherIcon({
  condition,
  size = 22,
  className,
}: {
  condition: WeatherDay["condition"];
  size?: number;
  className?: string;
}) {
  const props = { size, strokeWidth: 1.8, className: cx("shrink-0", className) };
  switch (condition) {
    case "sunny":
      return <Sun {...props} />;
    case "partly":
      return <CloudSun {...props} />;
    case "cloudy":
      return <Cloud {...props} />;
    case "showers":
      return <CloudRain {...props} />;
    case "rain":
      return <CloudRain {...props} />;
    case "storm":
      return <CloudLightning {...props} />;
  }
}

export function conditionLabel(condition: WeatherDay["condition"]) {
  return (
    {
      sunny: "Clear skies",
      partly: "Partly cloudy",
      cloudy: "Overcast",
      showers: "Light showers",
      rain: "Rain",
      storm: "Thunderstorms",
    } as const
  )[condition];
}

export function conditionTone(condition: WeatherDay["condition"]) {
  switch (condition) {
    case "sunny":
      return "text-amber-500";
    case "partly":
      return "text-amber-500/80";
    case "cloudy":
      return "text-slate-400";
    default:
      return "text-sky-500";
  }
}
