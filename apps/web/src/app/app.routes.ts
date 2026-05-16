import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/landing/landing.page').then((m) => m.LandingPage),
  },
  {
    path: 'play',
    loadComponent: () => import('./pages/game/game.page').then((m) => m.GamePage),
  },
  { path: '**', redirectTo: '' },
];
