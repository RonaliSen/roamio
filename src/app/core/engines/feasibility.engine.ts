import type { Destination } from '../models/destination.model';
import type { FeasibilityResult, TripIntent } from '../models/trip-intent.model';
import { computeBudgetTotal, estimateBudget } from './budget.engine';

export function checkFeasibility(
  intent: TripIntent,
  catalog: Destination[]
): FeasibilityResult {
  const candidates = catalog.filter(
    (d) =>
      (!intent.region || d.region === intent.region) &&
      (!intent.month || d.bestMonths.includes(intent.month))
  );

  if (candidates.length === 0) {
    const alternatives: { label: string; adjustedIntent: Partial<TripIntent> }[] = [];
    if (intent.month !== undefined) {
      alternatives.push({ label: 'Try a different month', adjustedIntent: { month: undefined } });
    }
    if (intent.region !== undefined) {
      alternatives.push({ label: 'Try a different region', adjustedIntent: { region: undefined } });
    }
    if (alternatives.length === 0) {
      alternatives.push({ label: 'Loosen your preferences', adjustedIntent: {} });
    }
    return {
      status: 'red',
      estimatedCostRange: { low: 0, high: 0 },
      travelIntensity: 'relaxed',
      weatherSuitable: false,
      reasons: ['No destinations match your region/month combination.'],
      alternatives,
    };
  }

  const days = intent.durationDays ?? 4;
  const travelers = intent.travelers ?? 1;

  // "cheapest"/"priciest" totals: feed a candidate's own low (resp. high) daily rate
  // as BOTH bounds into estimateBudget so its midpoint math collapses to a flat
  // dailyRate*days*travelers total, reusing the required budget functions instead
  // of reimplementing the multiplication.
  const low = Math.min(
    ...candidates.map((d) => computeBudgetTotal(estimateBudget(d.dailyBudgetLow, d.dailyBudgetLow, days, travelers)))
  );
  const high = Math.max(
    ...candidates.map((d) => computeBudgetTotal(estimateBudget(d.dailyBudgetHigh, d.dailyBudgetHigh, days, travelers)))
  );

  const reasons: string[] = [];
  // A tight budget only ever makes this single-destination trip 'amber' (harder),
  // never 'red' — 'red' is reserved for the structurally-infeasible zero-candidates
  // case above. There's no multi-city "impossible in the time available" logic here.
  let status: 'green' | 'amber' = 'green';
  if (intent.budget && intent.budget.amount < low) {
    status = 'amber';
    reasons.push(
      `Your budget of ${intent.budget.currency} ${intent.budget.amount} is below the estimated minimum of ${intent.budget.currency} ${low} for a matching destination.`
    );
  } else {
    reasons.push('Your trip looks realistic and within budget.');
  }

  const travelIntensity = !days || days >= 4 ? 'relaxed' : days >= 2 ? 'balanced' : 'fast-paced';

  return {
    status,
    estimatedCostRange: { low, high },
    travelIntensity,
    weatherSuitable: true,
    reasons,
  };
}
