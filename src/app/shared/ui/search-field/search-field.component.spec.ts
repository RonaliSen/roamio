import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SearchFieldComponent } from './search-field.component';

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
});
