import { WeatherDay } from '../models/weather.model';

export interface WeatherRec {
  id: string;
  label: string;
  reason: string;
}

export function weatherRecommendations(days: WeatherDay[], walkingIntensity: 'low' | 'medium' | 'high'): WeatherRec[] {
  const recommendations: WeatherRec[] = [];
  const seenIds = new Set<string>();

  // Rule 1: any day tempLowC < 10
  if (days.some(day => day.tempLowC < 10)) {
    const id = 'layer';
    if (!seenIds.has(id)) {
      seenIds.add(id);
      recommendations.push({
        id,
        label: 'Pack a warm layer',
        reason: 'Lows dip below 10°C on at least one day.'
      });
    }
  }

  // Rule 2: any day rainProbability >= 0.4
  if (days.some(day => day.rainProbability >= 0.4)) {
    const id = 'waterproof';
    if (!seenIds.has(id)) {
      seenIds.add(id);
      recommendations.push({
        id,
        label: 'Bring a waterproof shell',
        reason: 'High chance of rain during your stay.'
      });
    }
  }

  // Rule 3: walkingIntensity === 'high'
  if (walkingIntensity === 'high') {
    const id = 'comfortable-footwear';
    if (!seenIds.has(id)) {
      seenIds.add(id);
      recommendations.push({
        id,
        label: 'Wear broken-in walking shoes',
        reason: 'Your itinerary is walking-heavy.'
      });
    }
  }

  // Rule 4: any day tempHighC >= 28
  if (days.some(day => day.tempHighC >= 28)) {
    const id = 'sun-protection';
    if (!seenIds.has(id)) {
      seenIds.add(id);
      recommendations.push({
        id,
        label: 'Sun protection',
        reason: 'Daytime highs reach 28°C or more.'
      });
    }
  }

  return recommendations;
}
