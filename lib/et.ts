import { SOIL_WATER, type CropPreset } from "./crops";
import type { Plot, WeatherDay } from "./types";

const toRad = (deg: number) => (deg * Math.PI) / 180;
const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

export type Et0Input = {
  tMax: number;
  tMin: number;
  humidity: number;
  wind: number;
  solar: number;
  latitude: number;
  dayOfYear: number;
  elevationM?: number;
};

/**
 * FAO-56 Penman–Monteith reference evapotranspiration (mm/day).
 * Radiation in MJ/m²/day, wind in m/s at 2 m, humidity as mean relative %.
 */
export function calculateEt0({
  tMax,
  tMin,
  humidity,
  wind,
  solar,
  latitude,
  dayOfYear,
  elevationM = 1750,
}: Et0Input): number {
  const tMean = (tMax + tMin) / 2;
  const phi = toRad(latitude);
  const J = dayOfYear;

  // Atmospheric pressure & psychrometric constant
  const pressure = 101.3 * ((293 - 0.0065 * elevationM) / 293) ** 5.26;
  const gamma = 0.000665 * pressure;

  // Saturation vapour pressure
  const esTmax = 0.6108 * Math.exp((17.27 * tMax) / (tMax + 237.3));
  const esTmin = 0.6108 * Math.exp((17.27 * tMin) / (tMin + 237.3));
  const es = (esTmax + esTmin) / 2;
  const ea = (humidity / 100) * es;
  const vpd = Math.max(0, es - ea);

  // Slope of saturation vapour pressure curve
  const delta =
    (4098 * (0.6108 * Math.exp((17.27 * tMean) / (tMean + 237.3)))) /
    (tMean + 237.3) ** 2;

  // Extraterrestrial radiation
  const dr = 1 + 0.033 * Math.cos((2 * Math.PI * J) / 365);
  const solarDeclination = 0.409 * Math.sin((2 * Math.PI * J) / 365 - 1.39);
  const sunsetAngle = Math.acos(
    clamp(-Math.tan(phi) * Math.tan(solarDeclination), -1, 1),
  );
  const Ra =
    ((24 * 60) / Math.PI) *
    0.082 *
    dr *
    (sunsetAngle * Math.sin(phi) * Math.sin(solarDeclination) +
      Math.cos(phi) * Math.cos(solarDeclination) * Math.sin(sunsetAngle));

  // Clear-sky and net radiation
  const Rso = (0.75 + 2e-5 * elevationM) * Ra;
  const Rs = Math.min(solar, Rso);
  const Rns = 0.77 * Rs;
  const tMaxK = tMax + 273.16;
  const tMinK = tMin + 273.16;
  const Rnl =
    4.903e-9 *
    ((tMaxK ** 4 + tMinK ** 4) / 2) *
    (0.34 - 0.14 * Math.sqrt(ea)) *
    (1.35 * (Rso > 0 ? Rs / Rso : 0) - 0.35);
  const Rn = Rns - Rnl;

  const numerator =
    0.408 * delta * Rn +
    gamma * (900 / (tMean + 273)) * wind * vpd;
  const denominator = delta + gamma * (1 + 0.34 * wind);

  return Math.max(0, Number((numerator / denominator).toFixed(2)));
}

export function dayOfYear(iso: string): number {
  const d = new Date(`${iso}T00:00:00Z`);
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  return Math.floor((d.getTime() - start) / 86_400_000);
}

export function totalAvailableWaterMm(plot: Plot): number {
  const { fieldCapacity, wiltingPoint } = SOIL_WATER[plot.soil];
  return ((fieldCapacity - wiltingPoint) / 100) * plot.rootDepthM * 1000;
}

export function depletionFromMoisture(plot: Plot): number {
  const { fieldCapacity, wiltingPoint } = SOIL_WATER[plot.soil];
  const taw = totalAvailableWaterMm(plot);
  const fraction = clamp((fieldCapacity - plot.moisture) / (fieldCapacity - wiltingPoint), 0, 1);
  return fraction * taw;
}

export function moistureFromDepletion(plot: Plot, depletionMm: number): number {
  const { fieldCapacity, wiltingPoint } = SOIL_WATER[plot.soil];
  const taw = totalAvailableWaterMm(plot);
  return clamp(
    fieldCapacity - (depletionMm / Math.max(taw, 0.01)) * (fieldCapacity - wiltingPoint),
    wiltingPoint,
    fieldCapacity,
  );
}

/** Adjusted FAO-56 depletion fraction for the day's crop ET. */
export function adjustedP(p: number, etc: number): number {
  return clamp(p + 0.04 * (5 - etc), 0.1, 0.8);
}

export type BalancePoint = {
  date: string;
  precip: number;
  et0: number;
  etc: number;
  irrigation: number;
  depletionMm: number;
  taw: number;
  raw: number;
  ks: number;
  stress: boolean;
};

export function computeWaterBalance(
  plot: Plot,
  crop: CropPreset,
  weather: WeatherDay[],
  kc: number,
  initialDepletion?: number,
): BalancePoint[] {
  const taw = totalAvailableWaterMm(plot);
  let depletion = initialDepletion ?? depletionFromMoisture(plot);
  const points: BalancePoint[] = [];

  weather.forEach((day) => {
    const et0 = day.et0 ?? 0;
    const pAdj = adjustedP(crop.depletionFraction, et0 * kc);
    const raw = pAdj * taw;
    const ks = depletion <= raw ? 1 : clamp((taw - depletion) / Math.max(taw - raw, 0.01), 0, 1);
    const etc = et0 * kc * ks;
    const effectiveRain = Math.max(0, day.precip - 2);
    depletion = clamp(depletion + etc - effectiveRain, 0, taw);
    points.push({
      date: day.date,
      precip: day.precip,
      et0,
      etc,
      irrigation: 0,
      depletionMm: depletion,
      taw,
      raw,
      ks,
      stress: depletion > raw,
    });
  });

  return points;
}

export type IrrigationRecommendation = {
  action: "irrigate" | "delay" | "hold";
  urgency: "critical" | "warning" | "info" | "ok";
  depthMm: number;
  grossMm: number;
  durationMin: number;
  volumeM3: number;
  depletionMm: number;
  taw: number;
  raw: number;
  reason: string;
  nextRainMm: number;
};

export function recommendIrrigation(
  plot: Plot,
  crop: CropPreset,
  weather: WeatherDay[],
  kc: number,
): IrrigationRecommendation {
  const taw = totalAvailableWaterMm(plot);
  const depletion = depletionFromMoisture(plot);
  const raw = adjustedP(crop.depletionFraction, (weather[0]?.et0 ?? 0) * kc) * taw;
  const nextRain = weather
    .slice(1, 3)
    .reduce((sum, d) => sum + d.precip, 0);

  if (depletion <= raw * 0.55) {
    return {
      action: "hold",
      urgency: "ok",
      depthMm: 0,
      grossMm: 0,
      durationMin: 0,
      volumeM3: 0,
      depletionMm: depletion,
      taw,
      raw,
      nextRainMm: nextRain,
      reason: `Soil moisture is above the refill threshold (${Math.round((1 - depletion / taw) * 100)}% of usable water remains). No action needed today.`,
    };
  }

  if (nextRain >= 10 && depletion < taw * 0.85) {
    return {
      action: "delay",
      urgency: "warning",
      depthMm: 0,
      grossMm: 0,
      durationMin: 0,
      volumeM3: 0,
      depletionMm: depletion,
      taw,
      raw,
      nextRainMm: nextRain,
      reason: `${nextRain.toFixed(1)} mm of rain is forecast within 48 h — enough to refill part of the root zone. Delay irrigation and re-check on the next forecast.`,
    };
  }

  const depth = Math.min(depletion, taw * 0.9);
  const gross = depth / Math.max(plot.irrigationEfficiency, 0.3);
  const duration = (gross / Math.max(plot.applicationRate, 0.5)) * 60;
  const volume = gross * plot.areaHa * 10;

  return {
    action: "irrigate",
    urgency: depletion / taw >= 0.75 ? "critical" : "warning",
    depthMm: Math.round(depth * 10) / 10,
    grossMm: Math.round(gross * 10) / 10,
    durationMin: Math.round(duration),
    volumeM3: Math.round(volume),
    depletionMm: depletion,
    taw,
    raw,
    nextRainMm: nextRain,
    reason:
      depletion / taw >= 0.75
        ? `Root-zone depletion is ${Math.round((depletion / taw) * 100)}% — below the stress threshold. Irrigate at the next cool window to avoid yield loss.`
        : `Depletion has passed the refill threshold (${Math.round((depletion / taw) * 100)}% of TAW). Apply ${Math.round(depth)} mm to refill the root zone.`,
  };
}

export function statusFromMoisture(
  moisture: number,
  soil: Plot["soil"],
): "optimal" | "attention" | "critical" {
  const { fieldCapacity, wiltingPoint } = SOIL_WATER[soil];
  const fraction = (moisture - wiltingPoint) / (fieldCapacity - wiltingPoint);
  if (fraction >= 0.55) return "optimal";
  if (fraction >= 0.3) return "attention";
  return "critical";
}
