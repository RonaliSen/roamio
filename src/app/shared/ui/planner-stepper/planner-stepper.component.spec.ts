import { TestBed } from '@angular/core/testing';

import { PlannerStepperComponent } from './planner-stepper.component';

describe('PlannerStepperComponent', () => {
  const circles = (fixture: { nativeElement: HTMLElement }) =>
    Array.from(fixture.nativeElement.querySelectorAll('ol > li'));

  const outerSpan = (li: Element) => li.querySelector(':scope > span') as HTMLElement;

  it('shows the "Understand" step as current (not done) when current="understand"', () => {
    const fixture = TestBed.createComponent(PlannerStepperComponent);
    fixture.componentRef.setInput('current', 'understand');
    fixture.detectChanges();

    const [understand, check, plan] = circles(fixture);

    expect(outerSpan(understand).classList).toContain('text-charcoal');
    expect(understand.textContent).not.toContain('✓');

    expect(outerSpan(check).classList).toContain('text-taupe');
    expect(outerSpan(check).classList).not.toContain('text-charcoal');
    expect(outerSpan(plan).classList).toContain('text-taupe');
    expect(outerSpan(plan).classList).not.toContain('text-charcoal');
  });

  it('shows earlier steps as done (checkmark) and the last step as current when current="plan"', () => {
    const fixture = TestBed.createComponent(PlannerStepperComponent);
    fixture.componentRef.setInput('current', 'plan');
    fixture.detectChanges();

    const [understand, check, plan] = circles(fixture);

    expect(understand.textContent).toContain('✓');
    expect(check.textContent).toContain('✓');

    expect(outerSpan(plan).classList).toContain('text-charcoal');
    expect(plan.textContent).not.toContain('✓');
  });

  it('renders all three step labels', () => {
    const fixture = TestBed.createComponent(PlannerStepperComponent);
    fixture.componentRef.setInput('current', 'feasibility');
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Understand');
    expect(text).toContain('Check');
    expect(text).toContain('Plan');
  });
});
