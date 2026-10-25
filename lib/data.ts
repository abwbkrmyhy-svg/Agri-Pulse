import { CROPS, daysBetween, stageForDay } from "./crops";
import { calculateEt0, dayOfYear, recommendIrrigation, statusFromMoisture } from "./et";
import { polygonAreaHa } from "./geo";
import type {
  Alert,
  CropId,
  LatLng,
  Plot,
  SoilTest,
  WeatherDay,
} from "./types";

/** Fixed "today" for the demo dataset so server and client render identically. */
export const DEMO_TODAY = "2026-10-22";

export const FARM = {
  name: "Riverside Farm",
  manager: "Amina Wanjiru",
  location: "Nakuru, Kenya",
  latitude: -0.2867,
  longitude: 36.0722,
  elevationM: 1750,
  timezone: "Africa/Nairobi",
  boundary: [
    [-0.2824, 36.0664],
    [-0.2821, 36.0754],
    [-0.2880, 36.0757],
    [-0.2882, 36.0667],
  ] as LatLng[],
  waterSource: "Borehole + 120 m³ reservoir",
};

const rawWeather: Omit<WeatherDay, "et0">[] = [
  { date: "2026-10-22", tMax: 26, tMin: 13, humidity: 58, wind: 2.4, solar: 22.5, precip: 0, precipProb: 5, condition: "sunny" },
  { date: "2026-10-23", tMax: 27, tMin: 14, humidity: 55, wind: 2.8, solar: 23.1, precip: 0, precipProb: 5, condition: "sunny" },
  { date: "2026-10-24", tMax: 25, tMin: 14, humidity: 68, wind: 2.1, solar: 17.4, precip: 4.2, precipProb: 70, condition: "showers" },
  { date: "2026-10-25", tMax: 23, tMin: 13, humidity: 78, wind: 3.2, solar: 12.1, precip: 12.8, precipProb: 90, condition: "rain" },
  { date: "2026-10-26", tMax: 24, tMin: 13, humidity: 72, wind: 2.6, solar: 16.2, precip: 2.4, precipProb: 45, condition: "showers" },
  { date: "2026-10-27", tMax: 26, tMin: 14, humidity: 62, wind: 2.2, solar: 21.0, precip: 0, precipProb: 10, condition: "partly" },
  { date: "2026-10-28", tMax: 28, tMin: 15, humidity: 54, wind: 3.0, solar: 23.6, precip: 0, precipProb: 5, condition: "sunny" },
];

export const WEATHER: WeatherDay[] = rawWeather.map((day) => ({
  ...day,
  et0: calculateEt0({
    tMax: day.tMax,
    tMin: day.tMin,
    humidity: day.humidity,
    wind: day.wind,
    solar: day.solar,
    latitude: FARM.latitude,
    dayOfYear: dayOfYear(day.date),
    elevationM: FARM.elevationM,
  }),
}));

export const HOURLY_TODAY = [
  { time: "06:00", temp: 14, humidity: 82, et: 0.02 },
  { time: "08:00", temp: 18, humidity: 70, et: 0.18 },
  { time: "10:00", temp: 22, humidity: 58, et: 0.38 },
  { time: "12:00", temp: 25, humidity: 46, et: 0.52 },
  { time: "14:00", temp: 26, humidity: 42, et: 0.48 },
  { time: "16:00", temp: 24, humidity: 47, et: 0.29 },
  { time: "18:00", temp: 20, humidity: 58, et: 0.09 },
  { time: "20:00", temp: 17, humidity: 68, et: 0.02 },
];

const plotSeeds: Array<Omit<Plot, "areaHa">> = [
  {
    id: "plot-a",
    name: "North Maize",
    crop: "maize",
    variety: "DH04 hybrid",
    plantedAt: "2026-07-20",
    soil: "Loam",
    moisture: 21.4,
    rootDepthM: 0.9,
    ndvi: 0.81,
    system: "Pivot",
    applicationRate: 8.5,
    irrigationEfficiency: 0.78,
    color: "#358d51",
    lastIrrigated: "2026-10-19",
    polygon: [
      [-0.28385, 36.06975],
      [-0.28385, 36.07125],
      [-0.28515, 36.07125],
      [-0.28515, 36.06975],
    ],
  },
  {
    id: "plot-b",
    name: "River Beans",
    crop: "beans",
    variety: "Nyota",
    plantedAt: "2026-08-25",
    soil: "Sandy loam",
    moisture: 13.2,
    rootDepthM: 0.55,
    ndvi: 0.63,
    system: "Drip",
    applicationRate: 3.2,
    irrigationEfficiency: 0.9,
    color: "#c2712f",
    lastIrrigated: "2026-10-18",
    polygon: [
      [-0.28335, 36.07315],
      [-0.28335, 36.07445],
      [-0.28445, 36.07445],
      [-0.28445, 36.07315],
    ],
  },
  {
    id: "plot-c",
    name: "Greenhouse Tomatoes",
    crop: "tomato",
    variety: "Anna F1",
    plantedAt: "2026-07-01",
    soil: "Silt loam",
    moisture: 19.8,
    rootDepthM: 0.45,
    ndvi: 0.72,
    system: "Drip",
    applicationRate: 2.4,
    irrigationEfficiency: 0.92,
    color: "#b91c1c",
    lastIrrigated: "2026-10-17",
    polygon: [
      [-0.28590, 36.07145],
      [-0.28590, 36.07255],
      [-0.28685, 36.07255],
      [-0.28685, 36.07145],
    ],
  },
  {
    id: "plot-d",
    name: "West Pasture",
    crop: "pasture",
    variety: "Rhodes + desmodium",
    plantedAt: "2026-01-10",
    soil: "Clay loam",
    moisture: 27.6,
    rootDepthM: 0.6,
    ndvi: 0.77,
    system: "Sprinkler",
    applicationRate: 6.0,
    irrigationEfficiency: 0.75,
    color: "#6aa42f",
    lastIrrigated: "2026-10-20",
    polygon: [
      [-0.28450, 36.06685],
      [-0.28450, 36.06855],
      [-0.28625, 36.06855],
      [-0.28625, 36.06685],
    ],
  },
  {
    id: "plot-e",
    name: "East Wheat",
    crop: "wheat",
    variety: "Eagle 10",
    plantedAt: "2026-09-05",
    soil: "Loam",
    moisture: 17.9,
    rootDepthM: 0.8,
    ndvi: 0.58,
    system: "Rain-fed",
    applicationRate: 0,
    irrigationEfficiency: 0.7,
    color: "#a16207",
    lastIrrigated: "2026-10-10",
    polygon: [
      [-0.28260, 36.07402],
      [-0.28260, 36.07545],
      [-0.28375, 36.07545],
      [-0.28375, 36.07402],
    ],
  },
];

export const PLOTS: Plot[] = plotSeeds.map((plot) => ({
  ...plot,
  areaHa: Number(polygonAreaHa(plot.polygon).toFixed(2)),
}));

export function cropFor(plot: Plot) {
  return CROPS[plot.crop];
}

export function plotDay(plot: Plot): number {
  return daysBetween(plot.plantedAt, DEMO_TODAY);
}

export function plotStage(plot: Plot) {
  return stageForDay(cropFor(plot), plotDay(plot));
}

export function plotStatus(plot: Plot) {
  return statusFromMoisture(plot.moisture, plot.soil);
}

export function plotRecommendation(plot: Plot) {
  return recommendIrrigation(
    plot,
    cropFor(plot),
    WEATHER,
    plotStage(plot).kc,
  );
}

export const ALERTS: Alert[] = [
  {
    id: "alert-rain",
    severity: "warning",
    title: "Rain in 48 hours — hold irrigation",
    body: "12.8 mm forecast on 25 Oct. Delay the bean and maize cycles; re-check the water balance afterwards.",
    time: "2 h ago",
    plotId: "plot-b",
  },
  {
    id: "alert-moisture",
    severity: "critical",
    title: "Tomatoes below stress threshold",
    body: "Root-zone depletion is 71% of TAW. Irrigate 12 mm before 09:00 tomorrow.",
    time: "4 h ago",
    plotId: "plot-c",
  },
  {
    id: "alert-ndvi",
    severity: "info",
    title: "NDVI dip in East Wheat",
    body: "Plot NDVI fell 0.07 week-over-week. Scout for leaf rust in the north strip.",
    time: "Yesterday",
    plotId: "plot-e",
  },
];

export const SOIL_TESTS: Record<string, SoilTest> = {
  "plot-a": { ph: 6.3, nitrogen: 28, phosphorus: 17, potassium: 210, organicMatter: 2.8, ec: 0.42, sampledAt: "2026-09-28" },
  "plot-b": { ph: 5.9, nitrogen: 19, phosphorus: 12, potassium: 165, organicMatter: 2.1, ec: 0.31, sampledAt: "2026-09-30" },
  "plot-c": { ph: 6.8, nitrogen: 41, phosphorus: 26, potassium: 260, organicMatter: 3.6, ec: 0.68, sampledAt: "2026-10-04" },
  "plot-d": { ph: 5.6, nitrogen: 22, phosphorus: 9, potassium: 190, organicMatter: 3.1, ec: 0.27, sampledAt: "2026-09-21" },
  "plot-e": { ph: 6.1, nitrogen: 24, phosphorus: 14, potassium: 178, organicMatter: 2.4, ec: 0.35, sampledAt: "2026-09-26" },
};

export const WATER_LOG = [
  { date: "16 Oct", used: 118, saved: 22 },
  { date: "17 Oct", used: 96, saved: 34 },
  { date: "18 Oct", used: 142, saved: 18 },
  { date: "19 Oct", used: 105, saved: 41 },
  { date: "20 Oct", used: 88, saved: 46 },
  { date: "21 Oct", used: 74, saved: 52 },
  { date: "22 Oct", used: 61, saved: 58 },
];

export const TASKS = [
  { id: "t1", title: "Irrigate Greenhouse Tomatoes", detail: "12 mm · 300 min · drip", time: "Tomorrow 05:30", plotId: "plot-c", done: false, priority: "high" },
  { id: "t2", title: "Scout East Wheat for rust", detail: "NDVI anomaly, north strip", time: "Today 16:00", plotId: "plot-e", done: false, priority: "medium" },
  { id: "t3", title: "Calibrate pivot on North Maize", detail: "Flow test after last pressure drop", time: "23 Oct 09:00", plotId: "plot-a", done: false, priority: "low" },
  { id: "t4", title: "Soil sample — River Beans", detail: "Post-harvest NPK panel", time: "24 Oct 08:00", plotId: "plot-b", done: false, priority: "medium" },
  { id: "t5", title: "Clean drip filters", detail: "Greenhouse block B", time: "Done yesterday", plotId: "plot-c", done: true, priority: "low" },
];

export const CROP_MIX: Array<{ crop: CropId; area: number }> = PLOTS.reduce(
  (acc, plot) => {
    const found = acc.find((a) => a.crop === plot.crop);
    if (found) found.area += plot.areaHa;
    else acc.push({ crop: plot.crop, area: plot.areaHa });
    return acc;
  },
  [] as Array<{ crop: CropId; area: number }>,
);

export const FARM_AREA_HA = PLOTS.reduce((sum, p) => sum + p.areaHa, 0);
