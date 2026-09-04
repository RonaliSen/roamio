import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PackingStubComponent } from './packing-stub.component';

describe('PackingStubComponent', () => {
  let fixture: ComponentFixture<PackingStubComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PackingStubComponent] }).compileComponents();
    fixture = TestBed.createComponent(PackingStubComponent);
    fixture.detectChanges();
  });

  it('renders the coming-soon placeholder copy', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Coming soon');
    expect(text).toContain('packing list');
  });
});
