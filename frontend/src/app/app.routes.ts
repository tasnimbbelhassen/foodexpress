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
    path: 'restaurants/:id',
    loadComponent: () =>
      import('./pages/restaurant-details/restaurant-details.component').then((m) => m.RestaurantDetailsComponent),
  },
  {
    path: 'dishes',
    loadComponent: () =>
      import('./pages/search-dishes/search-dishes.component').then((m) => m.SearchDishesComponent),
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
    path: 'cart',
    canActivate: [authGuard, roleGuard('client')],
    loadComponent: () => import('./pages/cart/cart.component').then((m) => m.CartComponent),
  },
  {
    path: 'create-restaurant',
    canActivate: [authGuard, roleGuard('restaurateur', 'admin')],
    loadComponent: () =>
      import('./pages/create-restaurant/create-restaurant.component').then(
        (m) => m.CreateRestaurantComponent
      ),
  },
  {
    path: 'restaurant-dashboard',
    canActivate: [authGuard, roleGuard('restaurateur', 'admin')],
    children: [
      { path: '', redirectTo: 'restaurant', pathMatch: 'full' },
      {
        path: 'restaurant',
        loadComponent: () =>
          import('./restaurant-dashboard/manage-restaurant/manage-restaurant.component').then(
            (m) => m.ManageRestaurantComponent
          ),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./restaurant-dashboard/manage-categories/manage-categories.component').then(
            (m) => m.ManageCategoriesComponent
          ),
      },
      {
        path: 'dishes',
        loadComponent: () =>
          import('./restaurant-dashboard/manage-dishes/manage-dishes.component').then(
            (m) => m.ManageDishesComponent
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'restaurants' },
];