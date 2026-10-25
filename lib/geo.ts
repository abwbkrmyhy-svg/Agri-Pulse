import type { LatLng } from "./types";

const EARTH_RADIUS_M = 6_378_137;

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Spherical polygon area in hectares (works for small farm plots). */
export function polygonAreaHa(points: LatLng[]): number {
  if (points.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const [lat1, lon1] = points[i];
    const [lat2, lon2] = points[(i + 1) % points.length];
    sum +=
      toRad(lon2 - lon1) *
      (2 + Math.sin(toRad(lat1)) + Math.sin(toRad(lat2)));
  }
  const areaM2 = Math.abs((sum * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2);
  return areaM2 / 10_000;
}

export function polygonCentroid(points: LatLng[]): LatLng {
  if (!points.length) return [0, 0];
  const lat = points.reduce((s, p) => s + p[0], 0) / points.length;
  const lng = points.reduce((s, p) => s + p[1], 0) / points.length;
  return [lat, lng];
}

export function polygonPerimeterM(points: LatLng[]): number {
  let total = 0;
  for (let i = 0; i < points.length; i++) {
    const [lat1, lon1] = points[i];
    const [lat2, lon2] = points[(i + 1) % points.length];
    total += haversineM(lat1, lon1, lat2, lon2);
  }
  return total;
}

export function haversineM(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6_371_000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatArea(ha: number): string {
  return ha >= 1 ? `${ha.toFixed(2)} ha` : `${Math.round(ha * 10_000)} m²`;
}
