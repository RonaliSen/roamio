import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'discover',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/discover/discover.component').then((m) => m.DiscoverComponent),
  },
  {
    path: 'destinations/:slug',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/destinations/destination-detail.component').then(
        (m) => m.DestinationDetailComponent,
      ),
  },
  {
    path: 'plan/understand',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/plan/understand/understand.component').then(
        (m) => m.UnderstandComponent,
      ),
  },
  {
    path: 'plan/feasibility',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/plan/feasibility/feasibility.component').then(
        (m) => m.FeasibilityComponent,
      ),
  },
  {
    path: 'plan/recommendations',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/plan/recommendations/recommendations.component').then(
        (m) => m.RecommendationsComponent,
      ),
  },
  {
    path: 'trips/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/trips/trip-wizard.component').then((m) => m.TripWizardComponent),
  },
  {
    path: 'trips/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/trips/trip-dashboard.component').then((m) => m.TripDashboardComponent),
  },
  { path: '**', redirectTo: '' },
];
