export interface WeatherDay {
  date: string;
  tempHighC: number;
  tempLowC: number;
  /** 0..1 */
  rainProbability: number;
  windKph: number;
  condition: string;
}
