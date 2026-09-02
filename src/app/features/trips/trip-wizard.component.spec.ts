import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import { TripsService } from '../../core/services/trips.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { TripWizardComponent } from './trip-wizard.component';

const DRAFT_KEY = 'roamio:trip-draft';

describe('TripWizardComponent', () => {
  let create: jasmine.Spy;
  let show: jasmine.Spy;

  async function setup(query: Record<string, string> = {}) {
    create = jasmine.createSpy('create').and.resolveTo('trip-123');
    show = jasmine.createSpy('show');

    await TestBed.configureTestingModule({
      imports: [TripWizardComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { queryParamMap: of(convertToParamMap(query)) } },
        { provide: TripsService, useValue: { create } },
        { provide: ToastService, useValue: { show } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TripWizardComponent);
    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => localStorage.removeItem(DRAFT_KEY));

  it('blocks advancing past dates when end is before start', async () => {
    const fixture = await setup();
    const c = fixture.componentInstance;
    c.form.patchValue({ startDate: '2026-05-10', endDate: '2026-05-01' });
    c.step.set(1); // dates step
    expect(c.canAdvance()).toBe(false);
  });

  it('computes nights from the date range', async () => {
    const fixture = await setup();
    fixture.componentInstance.form.patchValue({ startDate: '2026-05-01', endDate: '2026-05-05' });
    expect(fixture.componentInstance.nights()).toBe(4);
  });

  it('creates a trip and navigates to it after completing every step', async () => {
    const fixture = await setup();
    const c = fixture.componentInstance;
    const nav = spyOn(TestBed.inject(Router), 'navigate');

    c.form.patchValue({
      destinationSlug: 'prague',
      startDate: '2026-05-01',
      endDate: '2026-05-05',
      travelers: 2,
      budgetTarget: 1200,
      interests: ['food'],
      title: 'Prague trip',
    });
    c.step.set(4);
    await c.submit();

    expect(create).toHaveBeenCalledTimes(1);
    const input = create.calls.mostRecent().args[0];
    expect(input.destinationSlug).toBe('prague');
    expect(input.travelers).toBe(2);
    expect(input.currency).toBeTruthy();
    expect(input.budget).toBeTruthy();
    expect(input.title).toBe('Prague trip');
    expect(nav).toHaveBeenCalledWith(['/trips', 'trip-123']);
    expect(show).toHaveBeenCalledWith('Trip created', 'info');
  });

  it('persists a draft on change and clears it on submit', async () => {
    const fixture = await setup();
    const c = fixture.componentInstance;

    c.form.patchValue({
      destinationSlug: 'prague',
      startDate: '2026-05-01',
      endDate: '2026-05-05',
      travelers: 2,
      budgetTarget: 1200,
      interests: [],
      title: 'Prague trip',
    });
    expect(localStorage.getItem(DRAFT_KEY)).not.toBeNull();

    c.step.set(4);
    await c.submit();
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it('initialises destinationSlug from the ?destination= query param', async () => {
    const fixture = await setup({ destination: 'prague' });
    expect(fixture.componentInstance.form.controls.destinationSlug.value).toBe('prague');
  });
});
