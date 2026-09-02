import { weatherRecommendations } from './weather-rules.engine';

const cold = [{ date: '2026-01-10', tempHighC: 4, tempLowC: -2, rainProbability: 0.1, windKph: 20, condition: 'clear' }];

describe('weatherRecommendations', () => {
  it('recommends a layer in the cold', () => {
    expect(weatherRecommendations(cold, 'low').map(r => r.id)).toContain('layer');
  });

  it('recommends waterproof when rain probability is high', () => {
    const wet = [{ ...cold[0], tempLowC: 12, rainProbability: 0.6 }];
    expect(weatherRecommendations(wet, 'low').map(r => r.id)).toContain('waterproof');
  });

  it('recommends comfortable footwear for walking-heavy trips', () => {
    expect(weatherRecommendations(cold, 'high').map(r => r.id)).toContain('comfortable-footwear');
  });

  it('recommends only sun protection for warm dry day with low intensity', () => {
    const warmDry = [{ date: '2026-01-10', tempHighC: 30, tempLowC: 18, rainProbability: 0.1, windKph: 10, condition: 'clear' }];
    expect(weatherRecommendations(warmDry, 'low').map(r => r.id)).toEqual(['sun-protection']);
  });

  it('dedupes recommendations when multiple days trigger the same rule', () => {
    const twoCold = [
      { date: '2026-01-10', tempHighC: 4, tempLowC: -2, rainProbability: 0.1, windKph: 20, condition: 'clear' },
      { date: '2026-01-11', tempHighC: 5, tempLowC: 0, rainProbability: 0.15, windKph: 15, condition: 'clear' }
    ];
    const ids = weatherRecommendations(twoCold, 'low').map(r => r.id);
    expect(ids.filter(id => id === 'layer').length).toBe(1);
  });
});
