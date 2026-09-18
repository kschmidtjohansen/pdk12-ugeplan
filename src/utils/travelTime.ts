/**
 * Rough travel-time estimate based on straight-line distance.
 * Straight-line km are multiplied by a road factor and converted at an average
 * speed. Always presented as an approximation ("ca.") in the UI.
 */
const ROAD_FACTOR = 1.3;
const AVG_SPEED_KMH = 60;

/** Estimated driving time in minutes, rounded to nearest 5 minutes (min 5). */
export const estimateTravelMinutes = (km: number): number => {
  if (!isFinite(km) || km <= 0) return 5;
  const minutes = (km * ROAD_FACTOR) / AVG_SPEED_KMH * 60;
  return Math.max(5, Math.round(minutes / 5) * 5);
};

/** "18 km" / "4,2 km" style formatting */
export const formatKm = (km: number): string =>
  km < 10 ? km.toFixed(1) : Math.round(km).toString();

/** "1 t 30 m" / "45 min" style formatting of a minute count */
export const formatMinutes = (minutes: number): string => {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (h === 0) return `${rest} min`;
  if (rest === 0) return `${h} t`;
  return `${h} t ${rest} m`;
};
