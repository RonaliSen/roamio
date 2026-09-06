import type { GeneratedDay } from '../models/trip-intent.model';

/**
 * An itinerary is valid when every day has at least one activity, or when there
 * are no activities anywhere (sparse-but-not-broken). Otherwise, repair by
 * moving one activity from the day with the most activities to each empty day.
 */
export function validateItinerary(days: GeneratedDay[]): { valid: boolean; repaired: GeneratedDay[] } {
  const totalActivities = days.reduce((sum, d) => sum + d.activities.length, 0);
  // When there are fewer activities than days, no distribution can give every
  // day ≥1 — that's not "broken", it's just sparse (same as the zero-activities
  // case). Repair should only be attempted when a fix is actually possible.
  const valid = totalActivities < days.length || days.every(d => d.activities.length > 0);
  if (valid) return { valid: true, repaired: days };

  // Repair: any empty day borrows one activity from whichever day currently has the most.
  const repaired = days.map(d => ({ ...d, activities: [...d.activities] }));
  for (const day of repaired) {
    if (day.activities.length === 0) {
      const donor = repaired.reduce((max, d) => (d.activities.length > max.activities.length ? d : max), repaired[0]);
      if (donor.activities.length > 1) {
        day.activities.push(donor.activities.pop()!);
      }
    }
  }
  return { valid: false, repaired };
}
