import type { BudgetBreakdown } from '../models/budget.model';

export function computeBudgetTotal(b: BudgetBreakdown): number {
  return (
    b.accommodation +
    b.transport +
    b.food +
    b.activities +
    b.localTransport +
    b.shopping
  );
}

export function estimateBudget(
  dailyLow: number,
  dailyHigh: number,
  nights: number,
  travelers: number
): BudgetBreakdown {
  const midpoint = (dailyLow + dailyHigh) / 2;
  const base = midpoint * nights * travelers;
  const roundedBase = Math.round(base);

  // Split percentages
  const accommodation = Math.round(base * 0.4);
  const food = Math.round(base * 0.25);
  const activities = Math.round(base * 0.15);
  const transport = Math.round(base * 0.1);
  const localTransport = Math.round(base * 0.05);
  const shopping = Math.round(base * 0.05);

  // Calculate sum of rounded values
  const sumRounded =
    accommodation +
    food +
    activities +
    transport +
    localTransport +
    shopping;

  // Absorb remainder into accommodation to ensure exact total
  const remainder = roundedBase - sumRounded;

  return {
    accommodation: accommodation + remainder,
    transport,
    food,
    activities,
    localTransport,
    shopping,
  };
}

export function scaleBudgetToTarget(
  b: BudgetBreakdown,
  target: number
): BudgetBreakdown {
  const current = computeBudgetTotal(b);

  // Avoid division by zero
  if (current === 0) {
    return { ...b };
  }

  const factor = target / current;

  // Scale each line and round
  const accommodation = Math.round(b.accommodation * factor);
  const transport = Math.round(b.transport * factor);
  const food = Math.round(b.food * factor);
  const activities = Math.round(b.activities * factor);
  const localTransport = Math.round(b.localTransport * factor);
  const shopping = Math.round(b.shopping * factor);

  // Calculate sum of scaled values
  const sumScaled =
    accommodation +
    transport +
    food +
    activities +
    localTransport +
    shopping;

  // Absorb remainder into accommodation to ensure exact total
  const remainder = target - sumScaled;

  return {
    accommodation: accommodation + remainder,
    transport,
    food,
    activities,
    localTransport,
    shopping,
  };
}
