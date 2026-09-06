import { rankDestinations } from './recommend.engine';
import { DESTINATIONS } from '../../fixtures/destinations.fixture';

describe('rankDestinations', () => {
  it('ranks region+month+budget matches above non-matches', () => {
    const results = rankDestinations(
      { region: 'Europe', month: 5, budget: { amount: 1000, currency: 'EUR' }, travelStyle: ['romantic'], preferences: [], interests: [], missingInformation: [], confidence: 0.9 },
      DESTINATIONS,
    );
    expect(results[0].destination.region).toBe('Europe');
    expect(results.every((r, i) => i === 0 || r.score <= results[i - 1].score)).toBe(true);
  });

  it('gives every candidate a reason list explaining the score', () => {
    const results = rankDestinations({ travelStyle: [], preferences: [], interests: [], missingInformation: [], confidence: 0.5 }, DESTINATIONS);
    expect(results[0].reasons.length).toBeGreaterThan(0);
  });

  it('includes all catalog destinations when the intent has no constraints', () => {
    const results = rankDestinations({ travelStyle: [], preferences: [], interests: [], missingInformation: [], confidence: 0.5 }, DESTINATIONS);
    expect(results.length).toBe(DESTINATIONS.length);
  });

  it('falls back to "A popular Roamio pick" for every result when nothing was explicitly specified', () => {
    // Nothing in the intent is explicitly set (no region/month/style/budget), so the
    // vacuous "unconstrained field always matches" scoring must not leak into reasons.
    const results = rankDestinations({ travelStyle: [], preferences: [], interests: [], missingInformation: [], confidence: 0.5 }, DESTINATIONS);
    expect(results.every((r) => r.reasons.includes('A popular Roamio pick'))).toBe(true);
  });

  it('does not credit "Fits your budget" to a destination that fails the budget-fit check', () => {
    // Marrakech is the cheapest (dailyBudgetLow 70) but 70*4*1=280 still exceeds
    // a $50 budget's 1.1x ceiling of 55, so it must not get the budget reason.
    const results = rankDestinations(
      { budget: { amount: 50, currency: 'USD' }, travelStyle: [], preferences: [], interests: [], missingInformation: [], confidence: 0.5 },
      DESTINATIONS,
    );
    const marrakech = results.find((r) => r.destination.slug === 'marrakech');
    expect(marrakech?.reasons.includes('Fits your budget')).toBe(false);
  });
});
