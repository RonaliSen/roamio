import type { BudgetBreakdown } from './budget.model';

export interface Trip {
  id: string;
  destinationSlug: string;
  title: string;
  startDate: string;
  endDate: string;
  travelers: number;
  interests: string[];
  currency: string;
  createdAt: string;
}

export interface TripActivity {
  id: string;
  tripDayId: string;
  title: string;
  category: string;
  startTime: string | null;
  notes: string | null;
  sortOrder: number;
}

export interface TripDay {
  id: string;
  tripId: string;
  dayIndex: number;
  date: string;
  activities: TripActivity[];
}

export interface TripDetail {
  trip: Trip;
  days: TripDay[];
  budget: BudgetBreakdown;
}

export interface CreateTripInput {
  destinationSlug: string;
  title: string;
  startDate: string;
  endDate: string;
  travelers: number;
  interests: string[];
  currency: string;
  budget: BudgetBreakdown;
}

export interface NewActivity {
  title: string;
  category?: string;
  startTime?: string | null;
  notes?: string | null;
}

/** Reference/fixture activity, distinct from {@link TripActivity}. */
export interface Activity {
  title: string;
  category: string;
  durationHours: number;
  walkingIntensity: 'low' | 'medium' | 'high';
}
