import type { Destination } from './destination.model';

export interface TripIntent {
  region?: string;
  durationDays?: number;
  travelers?: number;
  month?: number; // 1-12
  budget?: { amount: number; currency: string };
  travelStyle: string[];
  preferences: string[];
  interests: string[];
  missingInformation: string[];
  confidence: number; // 0-1
}

export interface FeasibilityResult {
  status: 'green' | 'amber' | 'red';
  estimatedCostRange: { low: number; high: number };
  travelIntensity: 'relaxed' | 'balanced' | 'fast-paced';
  weatherSuitable: boolean;
  reasons: string[];
  alternatives?: { label: string; adjustedIntent: Partial<TripIntent> }[];
}

export interface DestinationMatch {
  destination: Destination;
  score: number; // 0-100
  reasons: string[];
}

export interface GeneratedActivity {
  title: string;
  category: string;
  startTime?: string;
  notes?: string;
}

export interface GeneratedDay {
  dayIndex: number;
  activities: GeneratedActivity[];
}
