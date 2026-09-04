import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { computeBudgetTotal } from '../../core/engines/budget.engine';
import type { BudgetBreakdown } from '../../core/models/budget.model';
import { TripsService } from '../../core/services/trips.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { BudgetPanelComponent } from './budget-panel.component';

describe('BudgetPanelComponent', () => {
  let fixture: ComponentFixture<BudgetPanelComponent>;
  let component: BudgetPanelComponent;
  let trips: { updateBudget: jasmine.Spy };
  let toastShow: jasmine.Spy;

  const budget: BudgetBreakdown = {
    accommodation: 400,
    transport: 100,
    food: 250,
    activities: 150,
    localTransport: 50,
    shopping: 50,
  };

  beforeEach(async () => {
    trips = { updateBudget: jasmine.createSpy('updateBudget').and.resolveTo() };
    toastShow = jasmine.createSpy('show');

    await TestBed.configureTestingModule({
      imports: [BudgetPanelComponent],
      providers: [
        { provide: TripsService, useValue: trips },
        { provide: ToastService, useValue: { show: toastShow } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetPanelComponent);
    component = fixture.componentInstance;
    component.tripId = 't1';
    component.budget = { ...budget };
    fixture.detectChanges();
  });

  it('rescales the budget to the slider total', () => {
    let emitted: any;
    fixture.componentInstance.budgetChange.subscribe((b: any) => (emitted = b));
    fixture.componentInstance.onSlider(800);
    expect(
      emitted.accommodation +
        emitted.transport +
        emitted.food +
        emitted.activities +
        emitted.localTransport +
        emitted.shopping,
    ).toBe(800);
  });

  it('renders the current total in the DOM', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('1,000');
    expect(computeBudgetTotal(component.budget)).toBe(1000);
  });

  it('debounces the Supabase persist call by 400ms, after the sync emit', fakeAsync(() => {
    component.onSlider(800);
    expect(trips.updateBudget).not.toHaveBeenCalled();

    tick(399);
    expect(trips.updateBudget).not.toHaveBeenCalled();

    tick(1);
    expect(trips.updateBudget).toHaveBeenCalledWith('t1', jasmine.objectContaining({ accommodation: jasmine.any(Number) }));
    expect(computeBudgetTotal(trips.updateBudget.calls.mostRecent().args[1])).toBe(800);
  }));

  it('applies a targetHint bound after budget (out-of-order input assignment)', () => {
    // Simulates a parent template binding [budget] before [targetHint] in
    // source order — targetHint arrives on a later change-detection pass.
    const other = TestBed.createComponent(BudgetPanelComponent);
    const c = other.componentInstance;
    c.tripId = 't2';
    c.budget = { ...budget }; // total 1000 -> naive sliderMax would be 1500
    c.targetHint = 5000;
    other.detectChanges();

    expect(c.sliderMax()).toBe(5000);
  });

  it('toasts on a persistence failure without touching the emitted budget', fakeAsync(() => {
    trips.updateBudget.and.rejectWith(new Error('offline'));
    let emitted: any;
    component.budgetChange.subscribe((b: any) => (emitted = b));

    component.onSlider(600);
    tick(400);
    tick(0); // flush the rejected promise's microtask

    expect(toastShow).toHaveBeenCalledWith('Could not save budget', 'error');
    expect(computeBudgetTotal(emitted)).toBe(600);
  }));
});
