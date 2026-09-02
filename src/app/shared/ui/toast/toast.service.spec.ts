import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  it('adds then auto-dismisses a toast', fakeAsync(() => {
    const svc = TestBed.inject(ToastService);
    svc.show('saved');
    expect(svc.toasts().length).toBe(1);
    tick(4000);
    expect(svc.toasts().length).toBe(0);
  }));
});
