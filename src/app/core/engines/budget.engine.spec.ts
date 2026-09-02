import { computeBudgetTotal, estimateBudget, scaleBudgetToTarget } from './budget.engine';

describe('budget.engine', () => {
  it('sums all six lines', () => {
    expect(computeBudgetTotal({ accommodation: 400, transport: 100, food: 250, activities: 150, localTransport: 50, shopping: 50 })).toBe(1000);
  });
  it('estimates from daily range, nights and travelers', () => {
    const b = estimateBudget(90, 180, 4, 2); // midpoint 135 * 4 * 2 = 1080
    expect(computeBudgetTotal(b)).toBe(1080);
    expect(b.accommodation).toBe(432); // 40%
  });
  it('scales to an exact target with remainder on accommodation', () => {
    const b = scaleBudgetToTarget({ accommodation: 432, transport: 108, food: 270, activities: 162, localTransport: 54, shopping: 54 }, 800);
    expect(computeBudgetTotal(b)).toBe(800);
  });
  it('handles rounding with fractional base', () => {
    const b = estimateBudget(85, 170, 3, 1); // midpoint 127.5 * 3 * 1 = 382.5 -> rounds to 383
    expect(computeBudgetTotal(b)).toBe(383);
  });
  it('scales budget with remainder absorbed by accommodation', () => {
    const b = scaleBudgetToTarget(estimateBudget(90, 180, 4, 2), 555);
    expect(computeBudgetTotal(b)).toBe(555);
  });
});
