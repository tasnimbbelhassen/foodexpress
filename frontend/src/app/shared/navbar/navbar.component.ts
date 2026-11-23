import { Component, effect, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { RestaurantService } from '../../core/services/restaurant.service';
import { CartService } from '../../core/services/cart.service';
@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar navbar-expand navbar-dark bg-dark">
      <div class="container">
        <a class="navbar-brand" routerLink="/restaurants">🍕 FoodExpress</a>
        <ul class="navbar-nav ms-auto align-items-center flex-wrap">
          <li class="nav-item">
            <a class="nav-link" routerLink="/restaurants" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Restaurants</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" routerLink="/dishes" routerLinkActive="active">Plats</a>
          </li>

          @if (auth.isLoggedIn()) {
            @if (auth.user()?.role === 'restaurateur' && !restaurants.myRestaurant()) {
              <li class="nav-item">
                <a class="nav-link" routerLink="/create-restaurant" routerLinkActive="active">Créer mon restaurant</a>
              </li>
            }
            @if (auth.user()?.role === 'client') {
              <li class="nav-item">
                <a class="nav-link" routerLink="/cart" routerLinkActive="active">
                  🛒 Panier
                  @if (cart.count() > 0) { <span class="badge rounded-pill bg-warning text-dark">{{ cart.count() }}</span> }
                </a>
              </li>
               <li class="nav-item">
                <a class="nav-link" routerLink="/orders" routerLinkActive="active">Mes commandes</a>
              </li>
            }
            @if (auth.user()?.role === 'restaurateur' && restaurants.myRestaurant()) {
              <li class="nav-item">
                <a class="nav-link" routerLink="/restaurant-dashboard/restaurant" routerLinkActive="active">Mon restaurant</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" routerLink="/restaurant-dashboard/categories" routerLinkActive="active">Catégories</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" routerLink="/restaurant-dashboard/dishes" routerLinkActive="active">Mes plats</a>
              </li>
               <li class="nav-item">
                <a class="nav-link" routerLink="/restaurant-dashboard/orders" routerLinkActive="active">Commandes</a>
              </li>
            }
            <li class="nav-item">
              <a class="nav-link" routerLink="/profile" routerLinkActive="active">
                {{ auth.user()?.prenom }} ({{ auth.user()?.role }})
              </a>
            </li>
            <li class="nav-item">
              <button class="btn btn-outline-light btn-sm ms-2" (click)="logout()">Déconnexion</button>
            </li>
          } @else {
            <li class="nav-item"><a class="nav-link" routerLink="/login">Connexion</a></li>
            <li class="nav-item"><a class="btn btn-warning btn-sm ms-2" routerLink="/register">Inscription</a></li>
          }
        </ul>
      </div>
    </nav>
  `,
})
export class NavbarComponent {
  auth = inject(AuthService);
  restaurants = inject(RestaurantService);
    cart = inject(CartService);
  constructor() {
    // À chaque changement d'utilisateur : recharger son restaurant (restaurateur) ou vider
    effect(() => {
      const user = this.auth.user();
      if (user?.role === 'restaurateur') {
        this.restaurants.getMine().subscribe({ error: () => this.restaurants.myRestaurant.set(null) });
      } else {
        this.restaurants.myRestaurant.set(null);
      }
    });
  }

  logout() {
    this.restaurants.myRestaurant.set(null);
    this.auth.logout();
  }
}