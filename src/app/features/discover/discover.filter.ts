import type { Destination } from '../../core/models/destination.model';

export interface DiscoverFilters {
  query: string;
  maxDailyBudget: number | null;
  style: string | null;
  month: number | null;
}

/** Pure. Filters AND together; a null/empty filter is skipped. */
export function applyDiscoverFilters(all: Destination[], f: DiscoverFilters): Destination[] {
  const q = f.query.trim().toLowerCase();
  return all.filter((d) => {
    if (q) {
      const haystacks = [d.name, d.country, d.summary, ...d.styleTags];
      if (!haystacks.some((h) => h.toLowerCase().includes(q))) return false;
    }
    if (f.maxDailyBudget !== null && d.dailyBudgetLow > f.maxDailyBudget) return false;
    if (f.style !== null && !d.styleTags.includes(f.style)) return false;
    if (f.month !== null && !d.bestMonths.includes(f.month)) return false;
    return true;
  });
}
