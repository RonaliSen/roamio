export interface ReadinessInput {
  hasDates: boolean;
  daysWithActivity: number;
  totalDays: number;
  budgetTotal: number;
  budgetTarget: number;
}

export function computeReadiness(input: ReadinessInput): number {
  const { hasDates, daysWithActivity, totalDays, budgetTotal, budgetTarget } = input;

  // Dates component: 20 points
  const datesScore = hasDates ? 20 : 0;

  // Itinerary component: 50 points (proportion of days with activity)
  let itineraryScore = 0;
  if (totalDays > 0) {
    const ratio = Math.min(daysWithActivity / totalDays, 1); // Guard: clamp to max 1
    itineraryScore = 50 * ratio;
  }

  // Budget component: 30 points (with linear falloff)
  let budgetScore = 0;
  if (budgetTarget > 0) {
    const r = budgetTotal / budgetTarget;
    if (r <= 1) {
      budgetScore = 30;
    } else if (r < 1.5) {
      // Linear falloff from 30 at r=1 to 0 at r=1.5
      budgetScore = 30 * (1.5 - r) / 0.5;
    } else {
      budgetScore = 0;
    }
  }

  // Sum and round, clamp to 0..100
  const total = datesScore + itineraryScore + budgetScore;
  return Math.max(0, Math.min(100, Math.round(total)));
}
