import { ChangeDetectionStrategy, Component, Input, computed, inject, signal } from '@angular/core';

import { weatherRecommendations } from '../../core/engines/weather-rules.engine';
import type { WeatherDay } from '../../core/models/weather.model';
import { WeatherService } from '../../core/services/weather.service';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CONDITION_ICONS: Record<string, string> = {
  clear: '☀️',
  clouds: '☁️',
  rain: '🌧️',
};

@Component({
  selector: 'app-weather-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './weather-panel.component.html',
  styleUrl: './weather-panel.component.css',
})
export class WeatherPanelComponent {
  private readonly weatherService = inject(WeatherService);

  private _slug = '';
  private _startDate = '';
  private _days = 0;

  // Setters (not ngOnChanges) so a test setting these directly on the
  // instance — bypassing Angular's template-binding change tracking —
  // still triggers a refetch, matching ItineraryComponent's `days` input.
  @Input() set slug(v: string) {
    this._slug = v;
    this.refetch();
  }
  get slug(): string {
    return this._slug;
  }

  @Input() set startDate(v: string) {
    this._startDate = v;
    this.refetch();
  }
  get startDate(): string {
    return this._startDate;
  }

  @Input() set days(v: number) {
    this._days = v;
    this.refetch();
  }
  get days(): number {
    return this._days;
  }

  @Input() set walkingIntensity(v: 'low' | 'medium' | 'high') {
    this.walkingIntensitySig.set(v);
  }
  get walkingIntensity(): 'low' | 'medium' | 'high' {
    return this.walkingIntensitySig();
  }

  private readonly forecastSig = signal<WeatherDay[]>([]);
  private readonly walkingIntensitySig = signal<'low' | 'medium' | 'high'>('medium');

  readonly forecast = this.forecastSig.asReadonly();
  readonly recommendations = computed(() =>
    weatherRecommendations(this.forecastSig(), this.walkingIntensitySig()),
  );

  private refetch(): void {
    if (this._slug && this._startDate && this._days > 0) {
      this.weatherService
        .getForecast(this._slug, this._startDate, this._days)
        .subscribe((forecast) => this.forecastSig.set(forecast));
    }
  }

  shortDate(iso: string): string {
    const d = new Date(`${iso}T00:00:00Z`);
    return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
  }

  conditionIcon(condition: string): string {
    return CONDITION_ICONS[condition] ?? '❓';
  }
}
