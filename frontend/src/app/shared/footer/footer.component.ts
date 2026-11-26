import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

// Pied de page affiché sur toutes les pages (placé dans app.ts).
// Les styles sont dans styles.css (classes "fx-foot…"), comme pour la barre de navigation.
// ⚠ Remplace l'e-mail, le téléphone et l'adresse ci-dessous par les vrais.
@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  template: `
    <footer class="fx-foot">
      <div class="container">


        <div class="fx-foot__grid">
          <div class="fx-foot__brand">
            <a class="fx-brand" routerLink="/restaurants">
              <i><svg width="18" height="18"><use href="#i-pizza" /></svg></i>FoodExpress.
            </a>
            <p>Vos restaurants préférés, livrés chez vous partout en Tunisie. Paiement en espèces à la livraison.</p>
            <div class="fx-foot__social">
              <a href="https://www.instagram.com/" target="_blank" rel="noopener" aria-label="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a href="https://www.facebook.com/" target="_blank" rel="noopener" aria-label="Facebook">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8Z" />
                </svg>
              </a>
            </div>
          </div>

          <nav class="fx-foot__col" aria-label="Découvrir">
            <h4>Découvrir</h4>
            <a routerLink="/restaurants">Restaurants</a>
            <a routerLink="/dishes">Plats</a>
            <a routerLink="/restaurants" fragment="comment-ca-marche">Comment ça marche</a>
          </nav>

          <nav class="fx-foot__col" aria-label="Mon compte">
            <h4>Mon compte</h4>
            @if (auth.isLoggedIn()) {
              <a routerLink="/profile">Mon profil</a>
              @if (auth.user()?.role === 'client') {
                <a routerLink="/orders">Mes commandes</a>
                <a routerLink="/cart">Mon panier</a>
              }
            } @else {
              <a routerLink="/login">Connexion</a>
              <a routerLink="/register">Inscription</a>
            }
          </nav>

          <div class="fx-foot__col">
            <h4>Contact</h4>
            <a class="fx-foot__row" href="mailto:contact@foodexpress.tn">
              <i>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" />
                </svg>
              </i>contact&#64;foodexpress.tn
            </a>
            <a class="fx-foot__row" href="tel:+21670000000">
              <i>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
                </svg>
              </i>+216 70 000 000
            </a>
            <span class="fx-foot__row"><i><svg width="18" height="18"><use href="#i-pin" /></svg></i>Tunis, Tunisie</span>
            <span class="fx-foot__row"><i><svg width="18" height="18"><use href="#i-clock" /></svg></i>7j/7 · 10h – 23h</span>
          </div>
        </div>

        <div class="fx-foot__bottom">
          <span>© {{ year }} FoodExpress. Tous droits réservés.</span>
   
        </div>

      </div>
    </footer>
  `,
})
export class FooterComponent {
  auth = inject(AuthService);
  year = new Date().getFullYear();
}