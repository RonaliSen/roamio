export type Region = 'Europe' | 'Asia' | 'Africa' | 'Americas' | 'Oceania';

export interface Destination {
  slug: string;
  name: string;
  country: string;
  region: Region;
  summary: string;
  heroImage: string;
  bestMonths: number[];
  styleTags: string[];
  dailyBudgetLow: number;
  dailyBudgetHigh: number;
}
