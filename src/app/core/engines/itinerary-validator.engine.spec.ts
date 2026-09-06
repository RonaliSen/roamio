import { validateItinerary } from './itinerary-validator.engine';

describe('validateItinerary', () => {
  it('is valid when every day has at least one unique activity', () => {
    const days = [{ dayIndex: 0, activities: [{ title: 'A', category: 'x' }] }, { dayIndex: 1, activities: [{ title: 'B', category: 'y' }] }];
    expect(validateItinerary(days).valid).toBe(true);
  });
  it('repairs an empty day by borrowing from the largest neighboring day', () => {
    const days = [{ dayIndex: 0, activities: [{ title: 'A', category: 'x' }, { title: 'B', category: 'y' }] }, { dayIndex: 1, activities: [] }];
    const { valid, repaired } = validateItinerary(days);
    expect(valid).toBe(false);
    expect(repaired.every(d => d.activities.length > 0)).toBe(true);
  });
  it('treats an all-empty itinerary as valid (nothing to repair)', () => {
    const days = [{ dayIndex: 0, activities: [] }, { dayIndex: 1, activities: [] }];
    const { valid, repaired } = validateItinerary(days);
    expect(valid).toBe(true);
    expect(repaired).toEqual(days);
  });
});
