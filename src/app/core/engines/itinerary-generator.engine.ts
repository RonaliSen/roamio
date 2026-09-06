import type { TripIntent, GeneratedDay } from '../models/trip-intent.model';
import type { Destination } from '../models/destination.model';
import type { Activity } from '../models/trip.model';

/** Deterministically distributes reference activities round-robin across the requested number of days. */
export function generateItinerary(intent: TripIntent, _destination: Destination, activities: Activity[]): GeneratedDay[] {
  const n = intent.durationDays ?? 4;
  const days: GeneratedDay[] = Array.from({ length: n }, (_, i) => ({ dayIndex: i, activities: [] }));
  activities.forEach((a, i) => {
    days[i % n].activities.push({ title: a.title, category: a.category });
  });
  return days;
}
