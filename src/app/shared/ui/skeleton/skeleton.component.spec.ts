import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SkeletonComponent } from './skeleton.component';

describe('SkeletonComponent', () => {
  let fixture: ComponentFixture<SkeletonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SkeletonComponent] }).compileComponents();
    fixture = TestBed.createComponent(SkeletonComponent);
  });

  it('renders one shimmer bar per line', () => {
    fixture.componentRef.setInput('lines', 3);
    fixture.detectChanges();
    const bars = (fixture.nativeElement as HTMLElement).querySelectorAll('.animate-pulse');
    expect(bars.length).toBe(3);
  });

  it('renders at least one bar when lines is 0', () => {
    fixture.componentRef.setInput('lines', 0);
    fixture.detectChanges();
    const bars = (fixture.nativeElement as HTMLElement).querySelectorAll('.animate-pulse');
    expect(bars.length).toBe(1);
  });
});
