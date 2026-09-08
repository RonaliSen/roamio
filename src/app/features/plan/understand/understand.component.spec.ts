import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { TripPlannerStore } from '../../../core/services/trip-planner-store.service';
import { UnderstandComponent } from './understand.component';

describe('UnderstandComponent', () => {
  let fixture: ComponentFixture<UnderstandComponent>;
  let component: UnderstandComponent;
  let store: TripPlannerStore;
  let navSpy: jasmine.Spy;

  async function setup(message: string | undefined) {
    navSpy = jasmine.createSpy('navigate');
    const routerStub = {
      getCurrentNavigation: () =>
        message === undefined ? null : ({ extras: { state: { message } } } as any),
      navigate: navSpy,
    };

    await TestBed.configureTestingModule({
      imports: [UnderstandComponent],
      providers: [{ provide: Router, useValue: routerStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(UnderstandComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(TripPlannerStore);
  }

  it('parses the incoming message into an editable intent on init', async () => {
    await setup('romantic 4 days in Europe');
    fixture.detectChanges();
    expect(component.form.value.durationDays).toBe(4);
  });

  it('renders the planner stepper', async () => {
    await setup('romantic 4 days in Europe');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-planner-stepper')).toBeTruthy();
  });

  it('looks-right navigates to /plan/feasibility and stores the intent', async () => {
    await setup('romantic 4 days in Europe');
    fixture.detectChanges();
    component.confirm();
    expect(store.intent()).toBeTruthy();
    expect(navSpy).toHaveBeenCalledWith(['/plan/feasibility']);
  });

  it('renders an empty editable form without a router state, with no crash', async () => {
    await setup(undefined);
    expect(() => fixture.detectChanges()).not.toThrow();
    expect(component.form.value.durationDays).toBeNull();
  });
});
