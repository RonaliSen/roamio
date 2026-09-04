import type { Destination } from '../../core/models/destination.model';
import { applyDiscoverFilters } from './discover.filter';
const D: Destination[] = [
  { slug: 'prague', name: 'Prague', country: 'Czech Republic', region: 'Europe', summary: 'spires', heroImage: '', bestMonths: [4,5], styleTags: ['culture','walkable'], dailyBudgetLow: 90, dailyBudgetHigh: 180 },
  { slug: 'reykjavik', name: 'Reykjavik', country: 'Iceland', region: 'Europe', summary: 'aurora', heroImage: '', bestMonths: [7,8], styleTags: ['nature'], dailyBudgetLow: 150, dailyBudgetHigh: 300 },
];
describe('applyDiscoverFilters', () => {
  it('matches query against tags', () => {
    expect(applyDiscoverFilters(D, { query: 'walkable', maxDailyBudget: null, style: null, month: null }).map(d => d.slug)).toEqual(['prague']);
  });
  it('filters by max daily budget', () => {
    expect(applyDiscoverFilters(D, { query: '', maxDailyBudget: 100, style: null, month: null }).map(d => d.slug)).toEqual(['prague']);
  });
  it('filters by month', () => {
    expect(applyDiscoverFilters(D, { query: '', maxDailyBudget: null, style: null, month: 8 }).map(d => d.slug)).toEqual(['reykjavik']);
  });
  it('returns all on empty filters', () => {
    expect(applyDiscoverFilters(D, { query: '', maxDailyBudget: null, style: null, month: null }).length).toBe(2);
  });
});
