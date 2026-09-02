import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToastOutletComponent } from './toast.component';
import { ToastService } from './toast.service';

describe('ToastOutletComponent', () => {
  let fixture: ComponentFixture<ToastOutletComponent>;
  let service: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ToastOutletComponent] }).compileComponents();
    service = TestBed.inject(ToastService);
    service.toasts.set([
      { id: 'a', message: 'Saved', kind: 'info' },
      { id: 'b', message: 'Failed', kind: 'error' },
    ]);
    fixture = TestBed.createComponent(ToastOutletComponent);
    fixture.detectChanges();
  });

  it('renders one toast per ToastService.toasts() entry', () => {
    const el = fixture.nativeElement as HTMLElement;
    const items = el.querySelectorAll('[role="status"] > div');
    expect(items.length).toBe(2);
    expect(el.textContent).toContain('Saved');
    expect(el.textContent).toContain('Failed');
  });

  it('dismiss button calls ToastService.dismiss with the toast id', () => {
    const spy = spyOn(service, 'dismiss');
    const btn = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      'button[aria-label="Dismiss notification"]',
    );
    btn?.click();
    expect(spy).toHaveBeenCalledWith('a');
  });
});
