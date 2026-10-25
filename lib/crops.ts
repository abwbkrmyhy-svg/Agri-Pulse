import type { CropId, SoilTexture } from "./types";

export type GrowthStage = {
  key: "initial" | "development" | "mid" | "late";
  label: string;
  startDay: number;
  endDay: number;
  kc: number;
  ndvi: number;
};

export type CropPreset = {
  id: CropId;
  label: string;
  scientific: string;
  cycleDays: number;
  stages: GrowthStage[];
  rootDepthM: number;
  /** FAO-56 depletion fraction for no-stress (p) */
  depletionFraction: number;
  color: string;
  emoji: string;
};

export const CROPS: Record<CropId, CropPreset> = {
  maize: {
    id: "maize",
    label: "Maize",
    scientific: "Zea mays",
    cycleDays: 130,
    stages: [
      { key: "initial", label: "Emergence", startDay: 0, endDay: 20, kc: 0.3, ndvi: 0.22 },
      { key: "development", label: "Vegetative", startDay: 21, endDay: 55, kc: 0.85, ndvi: 0.62 },
      { key: "mid", label: "Tasselling", startDay: 56, endDay: 95, kc: 1.2, ndvi: 0.84 },
      { key: "late", label: "Grain fill", startDay: 96, endDay: 130, kc: 0.6, ndvi: 0.68 },
    ],
    rootDepthM: 0.9,
    depletionFraction: 0.55,
    color: "#358d51",
    emoji: "🌽",
  },
  beans: {
    id: "beans",
    label: "Beans",
    scientific: "Phaseolus vulgaris",
    cycleDays: 95,
    stages: [
      { key: "initial", label: "Emergence", startDay: 0, endDay: 15, kc: 0.35, ndvi: 0.25 },
      { key: "development", label: "Vegetative", startDay: 16, endDay: 40, kc: 0.75, ndvi: 0.6 },
      { key: "mid", label: "Flowering", startDay: 41, endDay: 70, kc: 1.1, ndvi: 0.8 },
      { key: "late", label: "Pod fill", startDay: 71, endDay: 95, kc: 0.5, ndvi: 0.62 },
    ],
    rootDepthM: 0.55,
    depletionFraction: 0.5,
    color: "#c2712f",
    emoji: "🫘",
  },
  tomato: {
    id: "tomato",
    label: "Tomatoes",
    scientific: "Solanum lycopersicum",
    cycleDays: 125,
    stages: [
      { key: "initial", label: "Transplant", startDay: 0, endDay: 20, kc: 0.6, ndvi: 0.32 },
      { key: "development", label: "Vegetative", startDay: 21, endDay: 45, kc: 0.95, ndvi: 0.66 },
      { key: "mid", label: "Fruiting", startDay: 46, endDay: 90, kc: 1.15, ndvi: 0.82 },
      { key: "late", label: "Ripening", startDay: 91, endDay: 125, kc: 0.8, ndvi: 0.7 },
    ],
    rootDepthM: 0.45,
    depletionFraction: 0.4,
    color: "#b91c1c",
    emoji: "🍅",
  },
  pasture: {
    id: "pasture",
    label: "Pasture",
    scientific: "Mixed grass-legume",
    cycleDays: 365,
    stages: [
      { key: "initial", label: "Regrowth", startDay: 0, endDay: 30, kc: 0.5, ndvi: 0.35 },
      { key: "development", label: "Tiller", startDay: 31, endDay: 90, kc: 0.85, ndvi: 0.64 },
      { key: "mid", label: "Full cover", startDay: 91, endDay: 270, kc: 1.0, ndvi: 0.79 },
      { key: "late", label: "Dormancy", startDay: 271, endDay: 365, kc: 0.7, ndvi: 0.58 },
    ],
    rootDepthM: 0.6,
    depletionFraction: 0.6,
    color: "#6aa42f",
    emoji: "🌿",
  },
  wheat: {
    id: "wheat",
    label: "Wheat",
    scientific: "Triticum aestivum",
    cycleDays: 120,
    stages: [
      { key: "initial", label: "Emergence", startDay: 0, endDay: 20, kc: 0.3, ndvi: 0.2 },
      { key: "development", label: "Tillering", startDay: 21, endDay: 50, kc: 0.8, ndvi: 0.58 },
      { key: "mid", label: "Heading", startDay: 51, endDay: 90, kc: 1.15, ndvi: 0.82 },
      { key: "late", label: "Ripening", startDay: 91, endDay: 120, kc: 0.4, ndvi: 0.55 },
    ],
    rootDepthM: 0.8,
    depletionFraction: 0.55,
    color: "#a16207",
    emoji: "🌾",
  },
  potato: {
    id: "potato",
    label: "Potatoes",
    scientific: "Solanum tuberosum",
    cycleDays: 110,
    stages: [
      { key: "initial", label: "Emergence", startDay: 0, endDay: 25, kc: 0.5, ndvi: 0.28 },
      { key: "development", label: "Vegetative", startDay: 26, endDay: 55, kc: 0.85, ndvi: 0.62 },
      { key: "mid", label: "Tuber fill", startDay: 56, endDay: 90, kc: 1.15, ndvi: 0.8 },
      { key: "late", label: "Maturation", startDay: 91, endDay: 110, kc: 0.7, ndvi: 0.6 },
    ],
    rootDepthM: 0.5,
    depletionFraction: 0.45,
    color: "#b45309",
    emoji: "🥔",
  },
};

/** Field capacity (volumetric, %) and wilting point (%) by texture. */
export const SOIL_WATER: Record<
  SoilTexture,
  { fieldCapacity: number; wiltingPoint: number; infiltration: number }
> = {
  Sandy: { fieldCapacity: 12, wiltingPoint: 5, infiltration: 25 },
  "Sandy loam": { fieldCapacity: 18, wiltingPoint: 8, infiltration: 20 },
  Loam: { fieldCapacity: 27, wiltingPoint: 12, infiltration: 14 },
  "Silt loam": { fieldCapacity: 31, wiltingPoint: 14, infiltration: 11 },
  "Clay loam": { fieldCapacity: 35, wiltingPoint: 18, infiltration: 6 },
  Clay: { fieldCapacity: 40, wiltingPoint: 22, infiltration: 3 },
};

export function kcForStage(stages: GrowthStage, day: number): number {
  return stages.kc;
}

export function stageForDay(
  crop: CropPreset,
  day: number,
): GrowthStage {
  const d = Math.max(0, day);
  return (
    crop.stages.find((s) => d >= s.startDay && d <= s.endDay) ??
    crop.stages[crop.stages.length - 1]
  );
}

export function daysBetween(isoStart: string, isoEnd: string): number {
  const a = Date.parse(`${isoStart}T00:00:00Z`);
  const b = Date.parse(`${isoEnd}T00:00:00Z`);
  return Math.max(0, Math.round((b - a) / 86_400_000));
}
