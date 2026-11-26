import { Component, effect, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { RestaurantService } from '../../core/services/restaurant.service';
import { CartService } from '../../core/services/cart.service';
@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, NgTemplateOutlet],
  template: `
    <header class="pn" (window:scroll)="progress(bar)" (window:resize)="progress(bar)">
      <div class="container">
        <div class="pn__pill">
          <a class="pn__brand" routerLink="/restaurants" (click)="open.set(false)">
            <i><svg width="16" height="16"><use href="#i-pizza" /></svg></i>FoodExpress<b>.</b>
          </a>

          <nav class="pn__links" aria-label="Navigation principale">
            <ng-container *ngTemplateOutlet="links" />
          </nav>

          <div class="pn__right">
            @if (auth.isLoggedIn()) {
              @if (auth.user()?.role === 'client') {
                <a class="pn__bag" routerLink="/cart" aria-label="Panier">
                  <svg width="20" height="20"><use href="#i-bag" /></svg>
                  @if (cart.count() > 0) { <b>{{ cart.count() }}</b> }
                </a>
                @if (cart.count() > 0) {
                  <a class="pn__cta" routerLink="/cart">Confirmer la commande</a>
                }
              }
              <a class="pn__user" routerLink="/profile" routerLinkActive="on" aria-label="Mon profil">
                <span>{{ (auth.user()?.prenom ?? '?').charAt(0).toUpperCase() }}</span>
              </a>
            } @else {
              <a class="pn__login" routerLink="/login">Connexion</a>
              <a class="pn__cta" routerLink="/register">Inscription</a>
            }
            <button class="pn__more" type="button" aria-label="Menu" [attr.aria-expanded]="open()" (click)="open.set(!open())">
              <i></i><i></i><i></i>
            </button>
          </div>

          <div class="pn__line"><i #bar></i></div>
        </div>

        @if (open()) {
          <div class="pn__menu" (click)="open.set(false)">
            <div class="pn__menu-links"><ng-container *ngTemplateOutlet="links" /></div>
            @if (auth.isLoggedIn()) {
              <a routerLink="/profile">
                <span class="pn__menu-av">{{ (auth.user()?.prenom ?? '?').charAt(0).toUpperCase() }}</span>
                {{ auth.user()?.prenom }} <small>{{ auth.user()?.role }}</small>
              </a>
              <button type="button" (click)="logout()">Déconnexion</button>
            } @else {
              <a routerLink="/login">Connexion</a>
              <a routerLink="/register">Inscription</a>
            }
          </div>
        }
      </div>
    </header>

    <ng-template #links>
      <a routerLink="/restaurants" routerLinkActive="on" [routerLinkActiveOptions]="{ exact: true }">Restaurants</a>
      <a routerLink="/dishes" routerLinkActive="on">Plats</a>

      @if (auth.isLoggedIn()) {
        @if (auth.user()?.role === 'restaurateur' && !restaurants.myRestaurant()) {
          <a routerLink="/create-restaurant" routerLinkActive="on">Créer mon restaurant</a>
        }
        @if (auth.user()?.role === 'client') {
          <a routerLink="/orders" routerLinkActive="on">Mes commandes</a>
        }
        @if (auth.user()?.role === 'restaurateur' && restaurants.myRestaurant()) {
          <a routerLink="/restaurant-dashboard/restaurant" routerLinkActive="on">Mon restaurant</a>
          <a routerLink="/restaurant-dashboard/categories" routerLinkActive="on">Catégories</a>
          <a routerLink="/restaurant-dashboard/dishes" routerLinkActive="on">Mes plats</a>
          <a routerLink="/restaurant-dashboard/orders" routerLinkActive="on">Commandes</a>
        }
      }
    </ng-template>
  `,
})
export class NavbarComponent {
  auth = inject(AuthService);
  restaurants = inject(RestaurantService);
  cart = inject(CartService);
  open = signal(false);
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

  // Ligne de progression : se remplit au fil du défilement de la page
  progress(bar: HTMLElement) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    bar.style.transform = `scaleX(${p})`;
  }

  logout() {
    this.restaurants.myRestaurant.set(null);
    this.auth.logout();
  }
}