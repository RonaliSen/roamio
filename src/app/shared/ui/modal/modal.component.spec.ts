import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalComponent } from './modal.component';

describe('ModalComponent', () => {
  let fixture: ComponentFixture<ModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ModalComponent] }).compileComponents();
    fixture = TestBed.createComponent(ModalComponent);
  });

  it('renders nothing when open=false', () => {
    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]')).toBeNull();
  });

  it('renders role="dialog" when open=true', () => {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]')).toBeTruthy();
  });

  it('emits openChange(false) on ESC', () => {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    const emitted: boolean[] = [];
    fixture.componentInstance.openChange.subscribe((v) => emitted.push(v));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(emitted).toEqual([false]);
  });

  it('emits openChange(false) on backdrop click', () => {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    const emitted: boolean[] = [];
    fixture.componentInstance.openChange.subscribe((v) => emitted.push(v));
    const backdrop = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      'button[aria-label="Close dialog"]',
    );
    backdrop?.click();
    expect(emitted).toEqual([false]);
  });

  it('does not re-capture focus when only title changes while open', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('title', 'Original');
    fixture.detectChanges();

    expect((fixture.componentInstance as unknown as { previouslyFocused: unknown }).previouslyFocused).toBe(
      trigger,
    );

    // focus moves elsewhere (e.g. into the modal's own content) while the modal stays open
    const decoy = document.createElement('button');
    document.body.appendChild(decoy);
    decoy.focus();

    fixture.componentRef.setInput('title', 'Changed');
    fixture.detectChanges();

    // the title-only change must not re-run focus capture — it should still be the original trigger
    expect((fixture.componentInstance as unknown as { previouslyFocused: unknown }).previouslyFocused).toBe(
      trigger,
    );

    document.body.removeChild(trigger);
    document.body.removeChild(decoy);
  });
});
