import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { InputComponent } from './input.component';

@Component({
  standalone: true,
  imports: [InputComponent, ReactiveFormsModule],
  template: `<app-input [formControl]="control" [error]="error" />`,
})
class HostComponent {
  control = new FormControl('');
  error?: string;
}

describe('InputComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  const inputEl = () => fixture.nativeElement.querySelector('input') as HTMLInputElement;

  it('writeValue reflects the model value to the <input>', () => {
    host.control.setValue('prague');
    fixture.detectChanges();
    expect(inputEl().value).toBe('prague');
  });

  it('typing propagates to the registered onChange', () => {
    const el = inputEl();
    el.value = 'oslo';
    el.dispatchEvent(new Event('input'));
    expect(host.control.value).toBe('oslo');
  });

  it('sets aria-invalid and renders error text when error is set', () => {
    host.error = 'Required';
    fixture.detectChanges();
    expect(inputEl().getAttribute('aria-invalid')).toBe('true');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Required');
  });
});
