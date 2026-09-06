import { TestBed } from '@angular/core/testing';
import { TripPlannerAiService } from './trip-planner-ai.service';
import { generateItinerary as buildItinerary } from '../engines/itinerary-generator.engine';
import { validateItinerary } from '../engines/itinerary-validator.engine';
import type { TripIntent } from '../models/trip-intent.model';
import type { Destination } from '../models/destination.model';
import type { Activity } from '../models/trip.model';

describe('TripPlannerAiService', () => {
  it('analyzeIntent delegates to the intent parser', () => {
    const svc = TestBed.inject(TripPlannerAiService);
    expect(svc.analyzeIntent('4 days in Europe').durationDays).toBe(4);
  });

  it('generateItinerary runs the generator output through validation and returns the repaired version when invalid', () => {
    const svc = TestBed.inject(TripPlannerAiService);
    const intent: TripIntent = {
      durationDays: 3,
      travelStyle: [],
      preferences: [],
      interests: [],
      missingInformation: [],
      confidence: 0.5,
    };
    const destination: Destination = {
      slug: 'lisbon',
      name: 'Lisbon',
      country: 'Portugal',
      region: 'Europe',
      summary: '',
      heroImage: '',
      bestMonths: [],
      styleTags: [],
      dailyBudgetLow: 50,
      dailyBudgetHigh: 100,
    };
    // Only 2 activities for a 3-day trip: the naive round-robin generator
    // fills days 0 and 1 with one activity each and leaves day 2 empty.
    const activities: Activity[] = [
      { title: 'Museum', category: 'culture', durationHours: 2, walkingIntensity: 'low' },
      { title: 'Beach', category: 'nature', durationHours: 3, walkingIntensity: 'medium' },
    ];

    // Sanity-check the premise: the raw generator output for this combo is
    // genuinely invalid (day 2 has no activities).
    const rawDays = buildItinerary(intent, destination, activities);
    const { valid, repaired } = validateItinerary(rawDays);
    expect(valid).toBe(false);

    // The service must hand back validateItinerary's `repaired` value for this
    // invalid input, not the raw (invalid) generator output.
    const result = svc.generateItinerary(intent, destination, activities);
    expect(result).toEqual(repaired);
  });
});
