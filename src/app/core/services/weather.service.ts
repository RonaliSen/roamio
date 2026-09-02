import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import type { WeatherDay } from '../models/weather.model';
import { forecastFor } from '../../fixtures/weather.fixture';

@Injectable({ providedIn: 'root' })
export class WeatherService {
  getForecast(slug: string, start: string, days: number): Observable<WeatherDay[]> {
    return of(forecastFor(slug, start, days));
  }
}
