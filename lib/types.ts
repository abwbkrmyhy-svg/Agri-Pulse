export type LatLng = [number, number];

export type CropId =
  | "maize"
  | "beans"
  | "tomato"
  | "pasture"
  | "wheat"
  | "potato";

export type SoilTexture =
  | "Sandy"
  | "Sandy loam"
  | "Loam"
  | "Silt loam"
  | "Clay loam"
  | "Clay";

export type MoistureStatus = "optimal" | "attention" | "critical";

export type Plot = {
  id: string;
  name: string;
  crop: CropId;
  variety: string;
  plantedAt: string; // ISO date
  areaHa: number;
  soil: SoilTexture;
  /** Volumetric soil moisture, % */
  moisture: number;
  /** Root-zone depth in metres */
  rootDepthM: number;
  /** NDVI 0..1 */
  ndvi: number;
  polygon: LatLng[];
  /** Drip / pivot / sprinkler */
  system: "Drip" | "Pivot" | "Sprinkler" | "Rain-fed";
  /** System application rate, mm/hour */
  applicationRate: number;
  irrigationEfficiency: number; // 0..1
  color: string;
  lastIrrigated: string; // ISO date
};

export type WeatherDay = {
  date: string;
  tMax: number;
  tMin: number;
  humidity: number; // mean RH %
  wind: number; // m/s at 2 m
  solar: number; // MJ/m²/day
  precip: number; // mm
  precipProb: number; // %
  condition: "sunny" | "partly" | "cloudy" | "showers" | "rain" | "storm";
  et0?: number;
};

export type SoilTest = {
  ph: number;
  nitrogen: number; // ppm
  phosphorus: number; // ppm
  potassium: number; // ppm
  organicMatter: number; // %
  ec: number; // dS/m
  sampledAt: string;
};

export type IrrigationPlan = {
  plotId: string;
  action: "irrigate" | "delay" | "hold";
  date: string;
  window: string;
  depthMm: number;
  durationMin: number;
  volumeM3: number;
  reason: string;
};

export type Alert = {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  body: string;
  time: string;
  plotId?: string;
};
