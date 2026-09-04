import { checkFeasibility } from './feasibility.engine';
import { DESTINATIONS } from '../../fixtures/destinations.fixture';

describe('checkFeasibility', () => {
  it('is green when the intent matches an affordable, in-season destination', () => {
    // Prague: Europe, budget 90-180/day, bestMonths include 4,5,6,9
    const r = checkFeasibility(
      { region: 'Europe', month: 5, durationDays: 4, travelers: 2, budget: { amount: 900, currency: 'EUR' }, travelStyle: [], preferences: [], interests: [], missingInformation: [], confidence: 0.9 },
      DESTINATIONS,
    );
    expect(r.status).toBe('green');
  });

  it('is red when no destination satisfies the constraints', () => {
    const r = checkFeasibility(
      { region: 'Oceania', travelStyle: [], preferences: [], interests: [], missingInformation: [], confidence: 0.9 },
      DESTINATIONS,
    );
    expect(r.status).toBe('red');
    expect(r.alternatives?.length).toBeGreaterThan(0);
  });

  it('is amber when matches exist but the budget is tight', () => {
    const r = checkFeasibility(
      { region: 'Europe', month: 5, durationDays: 4, travelers: 2, budget: { amount: 300, currency: 'EUR' }, travelStyle: [], preferences: [], interests: [], missingInformation: [], confidence: 0.9 },
      DESTINATIONS,
    );
    expect(r.status).toBe('amber');
  });

  it('never suggests adjusting a field the intent did not set', () => {
    // Only region set (no month) -> red alternatives should offer "different region" only, not "different month"
    const r = checkFeasibility(
      { region: 'Oceania', travelStyle: [], preferences: [], interests: [], missingInformation: [], confidence: 0.9 },
      DESTINATIONS,
    );
    expect(r.status).toBe('red');
    expect(r.alternatives?.some((a) => a.label === 'Try a different month')).toBe(false);
    expect(r.alternatives?.some((a) => a.label === 'Try a different region')).toBe(true);
  });

  it('produces a non-negative cost range when candidates exist', () => {
    const r = checkFeasibility(
      { region: 'Europe', month: 5, durationDays: 4, travelers: 2, travelStyle: [], preferences: [], interests: [], missingInformation: [], confidence: 0.9 },
      DESTINATIONS,
    );
    expect(r.estimatedCostRange.low).toBeGreaterThanOrEqual(0);
    expect(r.estimatedCostRange.high).toBeGreaterThanOrEqual(0);
  });
});
