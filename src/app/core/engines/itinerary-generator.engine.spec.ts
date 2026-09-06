import { generateItinerary } from './itinerary-generator.engine';
import { ACTIVITIES } from '../../fixtures/activities.fixture';
import { DESTINATIONS } from '../../fixtures/destinations.fixture';

describe('generateItinerary', () => {
  const prague = DESTINATIONS.find(d => d.slug === 'prague')!;
  it('produces one entry per requested day', () => {
    const days = generateItinerary({ durationDays: 3, travelStyle: [], preferences: [], interests: [], missingInformation: [], confidence: 0.9 }, prague, ACTIVITIES['prague']);
    expect(days.length).toBe(3);
    expect(days.map(d => d.dayIndex)).toEqual([0, 1, 2]);
  });
  it('gives every day at least one activity when activities exist', () => {
    const days = generateItinerary({ durationDays: 4, travelStyle: [], preferences: [], interests: [], missingInformation: [], confidence: 0.9 }, prague, ACTIVITIES['prague']);
    expect(days.every(d => d.activities.length > 0)).toBe(true);
  });
  it('defaults to 4 days when durationDays is absent', () => {
    const days = generateItinerary({ travelStyle: [], preferences: [], interests: [], missingInformation: [], confidence: 0.5 }, prague, ACTIVITIES['prague']);
    expect(days.length).toBe(4);
  });
  it('returns n empty days when there are no activities', () => {
    const days = generateItinerary({ durationDays: 4, travelStyle: [], preferences: [], interests: [], missingInformation: [], confidence: 0.5 }, prague, []);
    expect(days.length).toBe(4);
    expect(days.every(d => d.activities.length === 0)).toBe(true);
  });
});
