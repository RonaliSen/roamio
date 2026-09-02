import type { Activity } from '../core/models/trip.model';

/** Reference activities keyed by destination slug. Used by the weather-rules engine and destination page. */
export const ACTIVITIES: Record<string, Activity[]> = {
  prague: [
    { title: 'Charles Bridge at dawn', category: 'landmark', durationHours: 1, walkingIntensity: 'medium' },
    { title: 'Old Town Square & Astronomical Clock', category: 'landmark', durationHours: 1.5, walkingIntensity: 'low' },
    { title: 'Prague Castle & St. Vitus Cathedral', category: 'landmark', durationHours: 3, walkingIntensity: 'high' },
    { title: 'Petřín Hill climb & lookout tower', category: 'outdoor', durationHours: 2.5, walkingIntensity: 'high' },
    { title: 'Vltava riverside jazz cellar', category: 'nightlife', durationHours: 2, walkingIntensity: 'low' },
    { title: 'Beer hall dinner in Vinohrady', category: 'dining', durationHours: 2, walkingIntensity: 'low' },
  ],
  lisbon: [
    { title: 'Tram 28 through Alfama', category: 'sightseeing', durationHours: 1.5, walkingIntensity: 'low' },
    { title: 'Belém Tower & Jerónimos Monastery', category: 'landmark', durationHours: 3, walkingIntensity: 'medium' },
    { title: 'Time Out Market lunch crawl', category: 'dining', durationHours: 2, walkingIntensity: 'low' },
    { title: 'Miradouro sunset walk', category: 'outdoor', durationHours: 2, walkingIntensity: 'high' },
    { title: 'Day trip to Sintra palaces', category: 'sightseeing', durationHours: 6, walkingIntensity: 'high' },
  ],
  kyoto: [
    { title: 'Fushimi Inari torii gate hike', category: 'outdoor', durationHours: 3, walkingIntensity: 'high' },
    { title: 'Arashiyama bamboo grove', category: 'outdoor', durationHours: 2, walkingIntensity: 'medium' },
    { title: 'Kinkaku-ji Golden Pavilion', category: 'landmark', durationHours: 1.5, walkingIntensity: 'low' },
    { title: 'Gion evening lantern stroll', category: 'sightseeing', durationHours: 2, walkingIntensity: 'medium' },
    { title: 'Kaiseki dinner in Pontocho', category: 'dining', durationHours: 2.5, walkingIntensity: 'low' },
  ],
  reykjavik: [
    { title: 'Golden Circle self-drive loop', category: 'sightseeing', durationHours: 7, walkingIntensity: 'medium' },
    { title: 'Blue Lagoon geothermal soak', category: 'wellness', durationHours: 3, walkingIntensity: 'low' },
    { title: 'Northern lights night chase', category: 'outdoor', durationHours: 4, walkingIntensity: 'low' },
    { title: 'Hallgrímskirkja tower & old harbour walk', category: 'landmark', durationHours: 2, walkingIntensity: 'medium' },
    { title: 'Reykjadalur hot spring hike', category: 'outdoor', durationHours: 4, walkingIntensity: 'high' },
  ],
  marrakech: [
    { title: 'Jemaa el-Fnaa night market', category: 'sightseeing', durationHours: 2.5, walkingIntensity: 'medium' },
    { title: 'Bahia Palace & Saadian Tombs', category: 'landmark', durationHours: 2.5, walkingIntensity: 'medium' },
    { title: 'Souk spice and lantern bargaining', category: 'shopping', durationHours: 2, walkingIntensity: 'medium' },
    { title: 'Majorelle Garden & YSL Museum', category: 'sightseeing', durationHours: 2, walkingIntensity: 'low' },
    { title: 'Agafay desert-edge sunset dinner', category: 'dining', durationHours: 5, walkingIntensity: 'low' },
  ],
  amalfi: [
    { title: 'Path of the Gods ridge hike', category: 'outdoor', durationHours: 4, walkingIntensity: 'high' },
    { title: 'Amalfi Cathedral & cloister', category: 'landmark', durationHours: 1, walkingIntensity: 'low' },
    { title: 'Boat day to Positano', category: 'sightseeing', durationHours: 5, walkingIntensity: 'low' },
    { title: 'Lemon grove tasting terrace', category: 'dining', durationHours: 2, walkingIntensity: 'medium' },
    { title: 'Ravello gardens & viewpoints', category: 'sightseeing', durationHours: 3, walkingIntensity: 'medium' },
  ],
};
