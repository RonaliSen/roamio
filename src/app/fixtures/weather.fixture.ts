import type { WeatherDay } from '../core/models/weather.model';

interface Climate {
  high: number;
  low: number;
  rain: number;
  wind: number;
}

/** Per-slug base climate. */
const CLIMATE: Record<string, Climate> = {
  prague: { high: 18, low: 9, rain: 0.3, wind: 12 },
  lisbon: { high: 24, low: 15, rain: 0.15, wind: 15 },
  kyoto: { high: 20, low: 11, rain: 0.25, wind: 9 },
  reykjavik: { high: 12, low: 5, rain: 0.45, wind: 22 },
  marrakech: { high: 28, low: 15, rain: 0.1, wind: 11 },
  amalfi: { high: 26, low: 17, rain: 0.2, wind: 13 },
};

const DEFAULT_CLIMATE: Climate = { high: 20, low: 12, rain: 0.25, wind: 12 };

/** Small stable hash of the slug — drives the per-slug phase offset. */
function hashSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = (h * 31 + slug.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function addDays(startISO: string, n: number): string {
  const d = new Date(`${startISO}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function round(n: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function conditionFor(rainProbability: number): string {
  if (rainProbability > 0.5) return 'rain';
  if (rainProbability > 0.3) return 'clouds';
  return 'clear';
}

/**
 * Deterministically generates `days` weather entries starting at `startISO`
 * (date incremented by one day each). Seeded from the slug hash + day index —
 * no Math.random, no Date.now, so repeated calls deep-equal each other.
 */
export function forecastFor(slug: string, startISO: string, days: number): WeatherDay[] {
  const climate = CLIMATE[slug] ?? DEFAULT_CLIMATE;
  const phase0 = hashSlug(slug) % 7;
  const out: WeatherDay[] = [];
  for (let i = 0; i < days; i++) {
    const phase = phase0 + i;
    const tempSwing = Math.sin(phase * 0.7);
    const rainProbability = round(clamp01(climate.rain + Math.sin(phase * 1.3) * 0.15), 2);
    out.push({
      date: addDays(startISO, i),
      tempHighC: round(climate.high + tempSwing * 3, 1),
      tempLowC: round(climate.low + tempSwing * 2, 1),
      rainProbability,
      windKph: round(climate.wind + Math.cos(phase * 0.9) * 4, 1),
      condition: conditionFor(rainProbability),
    });
  }
  return out;
}
