import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WardrobeStubComponent } from './wardrobe-stub.component';

describe('WardrobeStubComponent', () => {
  let fixture: ComponentFixture<WardrobeStubComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [WardrobeStubComponent] }).compileComponents();
    fixture = TestBed.createComponent(WardrobeStubComponent);
    fixture.detectChanges();
  });

  it('renders the coming-soon placeholder copy', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Coming soon');
    expect(text).toContain('capsule wardrobe');
  });
});
