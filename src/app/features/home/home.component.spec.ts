import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HomeComponent], providers: [provideRouter([])] }).compileComponents();
    fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
  });
  it('renders the brand line', () => {
    expect(fixture.nativeElement.textContent).toContain('Every journey, considered');
  });
  it('navigates to discover with the query on search', () => {
    const nav = spyOn(TestBed.inject(Router), 'navigate');
    fixture.componentInstance.onSearch('prague in spring');
    expect(nav).toHaveBeenCalledWith(['/discover'], { queryParams: { q: 'prague in spring' } });
  });
});
