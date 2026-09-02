import { forecastFor } from './weather.fixture';

describe('forecastFor', () => {
  it('is deterministic and produces consecutive dates', () => {
    const a = forecastFor('prague', '2026-05-01', 3);
    const b = forecastFor('prague', '2026-05-01', 3);
    expect(a).toEqual(b);
    expect(a.length).toBe(3);
    expect(a.map((d) => d.date)).toEqual(['2026-05-01', '2026-05-02', '2026-05-03']);
  });
});
