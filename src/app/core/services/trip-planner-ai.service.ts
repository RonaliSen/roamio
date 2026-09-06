import { Injectable } from '@angular/core';
import { parseIntent } from '../engines/intent-parser.engine';
import { generateItinerary as buildItinerary } from '../engines/itinerary-generator.engine';
import { validateItinerary } from '../engines/itinerary-validator.engine';
import type { TripIntent, GeneratedDay } from '../models/trip-intent.model';
import type { Destination } from '../models/destination.model';
import type { Activity } from '../models/trip.model';

@Injectable({ providedIn: 'root' })
export class TripPlannerAiService {
  analyzeIntent(message: string): TripIntent {
    return parseIntent(message);
  }

  generateItinerary(intent: TripIntent, destination: Destination, activities: Activity[]): GeneratedDay[] {
    const days = buildItinerary(intent, destination, activities);
    const { valid, repaired } = validateItinerary(days);
    return valid ? days : repaired;
  }
}
