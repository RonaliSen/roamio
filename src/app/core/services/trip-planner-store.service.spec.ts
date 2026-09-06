import { TestBed } from '@angular/core/testing';
import { TripPlannerStore } from './trip-planner-store.service';

describe('TripPlannerStore', () => {
  it('patches the intent without clobbering unrelated fields', () => {
    const store = TestBed.inject(TripPlannerStore);
    store.setIntent({ region: 'Europe', travelStyle: [], preferences: [], interests: [], missingInformation: [], confidence: 0.5 });
    store.patchIntent({ durationDays: 5 });
    expect(store.intent()).toEqual(jasmine.objectContaining({ region: 'Europe', durationDays: 5 }));
  });
  it('reset clears every signal', () => {
    const store = TestBed.inject(TripPlannerStore);
    store.setIntent({ travelStyle: [], preferences: [], interests: [], missingInformation: [], confidence: 0.5 });
    store.reset();
    expect(store.intent()).toBeNull();
  });
  it('patchIntent before setIntent is a safe no-op', () => {
    const store = TestBed.inject(TripPlannerStore);
    expect(() => store.patchIntent({ durationDays: 5 })).not.toThrow();
    expect(store.intent()).toBeNull();
  });
});
