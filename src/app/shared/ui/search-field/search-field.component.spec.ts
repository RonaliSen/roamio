import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SearchFieldComponent } from './search-field.component';

// Mounts SearchFieldComponent behind a real `(search)` listener, the way Home/Discover
// do — the isolated `fixture` below (no parent listener) can't catch the native `search`
// DOM event leaking past the component, since nothing is listening for it to leak into.
@Component({
  standalone: true,
  imports: [SearchFieldComponent],
  template: `<app-search-field (search)="calls.push($event)" />`,
})
class HostComponent {
  calls: unknown[] = [];
}

describe('SearchFieldComponent', () => {
  let fixture: ComponentFixture<SearchFieldComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SearchFieldComponent] }).compileComponents();
    fixture = TestBed.createComponent(SearchFieldComponent);
    fixture.detectChanges();
  });

  it('debounces input and emits once', fakeAsync(() => {
    const emitted: string[] = [];
    fixture.componentInstance.search.subscribe((v) => emitted.push(v));
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = 'pra'; input.dispatchEvent(new Event('input'));
    input.value = 'prague'; input.dispatchEvent(new Event('input'));
    tick(300);
    expect(emitted).toEqual(['prague']);
  }));

  it('emits exactly once on Enter with no trailing debounced duplicate', fakeAsync(() => {
    const emitted: string[] = [];
    fixture.componentInstance.search.subscribe((v) => emitted.push(v));
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = 'prague in spring'; input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(emitted).toEqual(['prague in spring']);
    tick(300);
    expect(emitted).toEqual(['prague in spring']);
  }));

  it('does not leak the native "search" DOM event to a parent (search) listener — ' +
    'covers both the Enter-key path and the browser\'s native clear (×) button, which ' +
    'fires the same event via a path that never touches (keydown.enter)', fakeAsync(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [HostComponent] });
    const hostFixture = TestBed.createComponent(HostComponent);
    hostFixture.detectChanges();
    const input: HTMLInputElement = hostFixture.nativeElement.querySelector('input');

    input.value = 'prague';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    tick(300);

    // Simulates the clear (×) button: dispatched directly, with no preceding
    // keydown.enter — the exact path (keydown.enter)="preventDefault()" cannot cover.
    input.dispatchEvent(new Event('search', { bubbles: true }));

    const host = hostFixture.componentInstance;
    expect(host.calls).toEqual(['prague']);
    expect(host.calls.every((v) => typeof v === 'string')).toBe(true);
  }));
});
