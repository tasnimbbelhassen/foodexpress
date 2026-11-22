import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'restaurants', pathMatch: 'full' },
  {
    path: 'restaurants',
    loadComponent: () =>
      import('./pages/restaurants/restaurants.component').then((m) => m.RestaurantsComponent),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile/profile.component').then((m) => m.ProfileComponent),
  },
  {
    path: 'create-restaurant',
    canActivate: [authGuard, roleGuard('restaurateur', 'admin')],
    loadComponent: () =>
      import('./pages/create-restaurant/create-restaurant.component').then(
        (m) => m.CreateRestaurantComponent
      ),
  },
  { path: '**', redirectTo: 'restaurants' },
];