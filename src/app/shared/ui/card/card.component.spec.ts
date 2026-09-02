import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { CardComponent } from './card.component';

@Component({
  standalone: true,
  imports: [CardComponent],
  template: `<app-card><p class="projected">hello world</p></app-card>`,
})
class HostComponent {}

describe('CardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
  });

  it('renders a container element and projects its content', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const container = el.querySelector('app-card > div');
    expect(container).toBeTruthy();
    expect(container?.querySelector('.projected')?.textContent).toContain('hello world');
  });
});
