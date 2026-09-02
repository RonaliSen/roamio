export interface Destination {
  slug: string;
  name: string;
  country: string;
  summary: string;
  heroImage: string;
  bestMonths: number[];
  styleTags: string[];
  dailyBudgetLow: number;
  dailyBudgetHigh: number;
}
