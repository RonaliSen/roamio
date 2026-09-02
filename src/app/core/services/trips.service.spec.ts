import {
  datesInRange,
  rowToTrip,
  rowToTripActivity,
  rowToTripDay,
  rowToBudget,
} from './trips.service';

describe('datesInRange', () => {
  it('is inclusive of both ends', () => {
    expect(datesInRange('2026-05-01', '2026-05-04')).toEqual([
      '2026-05-01',
      '2026-05-02',
      '2026-05-03',
      '2026-05-04',
    ]);
  });
  it('handles a single day', () => {
    expect(datesInRange('2026-05-01', '2026-05-01')).toEqual(['2026-05-01']);
  });
  it('returns [] when end is before start', () => {
    expect(datesInRange('2026-05-04', '2026-05-01')).toEqual([]);
  });
});

describe('row mappers', () => {
  it('rowToTrip maps snake_case -> camelCase', () => {
    expect(
      rowToTrip({
        id: 't1',
        destination_slug: 'prague',
        title: 'Prague trip',
        start_date: '2026-05-01',
        end_date: '2026-05-04',
        travelers: 2,
        interests: ['food', 'history'],
        currency: 'EUR',
        created_at: '2026-01-01T00:00:00Z',
      }),
    ).toEqual({
      id: 't1',
      destinationSlug: 'prague',
      title: 'Prague trip',
      startDate: '2026-05-01',
      endDate: '2026-05-04',
      travelers: 2,
      interests: ['food', 'history'],
      currency: 'EUR',
      createdAt: '2026-01-01T00:00:00Z',
    });
  });

  it('rowToTrip defaults null interests to []', () => {
    expect(rowToTrip({ id: 't1', interests: null } as never).interests).toEqual([]);
  });

  it('rowToTripActivity maps snake_case -> camelCase', () => {
    expect(
      rowToTripActivity({
        id: 'a1',
        trip_day_id: 'd1',
        title: 'Castle tour',
        category: 'sightseeing',
        start_time: '09:00',
        notes: 'buy tickets online',
        sort_order: 2,
      }),
    ).toEqual({
      id: 'a1',
      tripDayId: 'd1',
      title: 'Castle tour',
      category: 'sightseeing',
      startTime: '09:00',
      notes: 'buy tickets online',
      sortOrder: 2,
    });
  });

  it('rowToTripDay maps snake_case -> camelCase and keeps activities', () => {
    const acts = [{ id: 'a1' } as never];
    expect(rowToTripDay({ id: 'd1', trip_id: 't1', day_index: 0, date: '2026-05-01' }, acts)).toEqual({
      id: 'd1',
      tripId: 't1',
      dayIndex: 0,
      date: '2026-05-01',
      activities: acts,
    });
  });

  it('rowToBudget maps snake_case -> camelCase', () => {
    expect(
      rowToBudget({
        accommodation: 400,
        transport: 200,
        food: 150,
        activities: 120,
        local_transport: 40,
        shopping: 60,
      }),
    ).toEqual({
      accommodation: 400,
      transport: 200,
      food: 150,
      activities: 120,
      localTransport: 40,
      shopping: 60,
    });
  });
});
