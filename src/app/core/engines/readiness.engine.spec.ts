import { computeReadiness } from './readiness.engine';

describe('computeReadiness', () => {
  it('is 100 when everything is ready', () => {
    expect(computeReadiness({ hasDates: true, daysWithActivity: 4, totalDays: 4, budgetTotal: 900, budgetTarget: 1000 })).toBe(100);
  });

  it('is 0 when nothing is ready', () => {
    expect(computeReadiness({ hasDates: false, daysWithActivity: 0, totalDays: 4, budgetTotal: 2000, budgetTarget: 1000 })).toBe(0);
  });

  it('gives partial itinerary credit', () => {
    expect(computeReadiness({ hasDates: true, daysWithActivity: 2, totalDays: 4, budgetTotal: 900, budgetTarget: 1000 })).toBe(75);
  });

  it('is 50 when only dates and itinerary are ready', () => {
    expect(computeReadiness({ hasDates: true, daysWithActivity: 0, totalDays: 4, budgetTotal: 900, budgetTarget: 1000 })).toBe(50);
  });
});
