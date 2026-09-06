import type { Destination } from '../models/destination.model';
import type { DestinationMatch, TripIntent } from '../models/trip-intent.model';
import { computeBudgetTotal, estimateBudget } from './budget.engine';

export function rankDestinations(
  intent: TripIntent,
  catalog: Destination[]
): DestinationMatch[] {
  const days = intent.durationDays ?? 4;
  const travelers = intent.travelers ?? 1;
  const wantedStyles = [
    ...intent.travelStyle,
    ...intent.preferences,
    ...intent.interests,
  ];

  return catalog
    .map((d) => {
      const reasons: string[] = [];
      let score = 50;

      const regionMatches = !intent.region || d.region === intent.region;
      if (regionMatches) score += 20;
      if (intent.region && d.region === intent.region) {
        reasons.push('In your preferred region');
      }

      const monthMatches = !intent.month || d.bestMonths.includes(intent.month);
      if (monthMatches) score += 15;
      if (intent.month && d.bestMonths.includes(intent.month)) {
        reasons.push('Great weather in your travel month');
      }

      const overlap = wantedStyles.filter((s) => d.styleTags.includes(s)).length;
      const styleScore = 15 * (overlap / Math.max(1, wantedStyles.length));
      score += styleScore;
      if (overlap > 0) {
        reasons.push('Matches your travel style');
      }

      let budgetFits = true;
      if (intent.budget) {
        const total = computeBudgetTotal(
          estimateBudget(d.dailyBudgetLow, d.dailyBudgetLow, days, travelers)
        );
        budgetFits = total <= intent.budget.amount * 1.1;
        if (!budgetFits) score -= 10;
      }
      if (intent.budget && budgetFits) {
        reasons.push('Fits your budget');
      }

      if (reasons.length === 0) {
        reasons.push('A popular Roamio pick');
      }

      score = Math.round(Math.min(100, Math.max(0, score)));

      return { destination: d, score, reasons };
    })
    .sort((a, b) => b.score - a.score);
}
