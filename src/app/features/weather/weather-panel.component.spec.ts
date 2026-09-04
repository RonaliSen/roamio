import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeatherPanelComponent } from './weather-panel.component';

describe('WeatherPanelComponent', () => {
  let fixture: ComponentFixture<WeatherPanelComponent>;
  let component: WeatherPanelComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeatherPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WeatherPanelComponent);
    component = fixture.componentInstance;
    component.slug = 'prague';
    component.startDate = '2026-05-01';
    component.days = 3;
    component.walkingIntensity = 'low';
    fixture.detectChanges();
  });

  it('renders one forecast chip per day', () => {
    expect(component.forecast().length).toBe(3);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.flex.flex-col.items-center').length).toBe(3);
  });

  it('does not crash with the default walkingIntensity', () => {
    const other = TestBed.createComponent(WeatherPanelComponent);
    other.componentInstance.slug = 'kyoto';
    other.componentInstance.startDate = '2026-05-01';
    other.componentInstance.days = 2;
    expect(() => other.detectChanges()).not.toThrow();
    expect(other.componentInstance.forecast().length).toBe(2);
  });
});
