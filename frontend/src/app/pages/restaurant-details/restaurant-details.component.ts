import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Menu, RestaurantService } from '../../core/services/restaurant.service';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { Dish } from '../../core/services/dish.service';
@Component({
  selector: 'app-restaurant-details',
  imports: [FormsModule, RouterLink],
  template: `
    <a routerLink="/restaurants" class="mn-back"><svg width="16" height="16"><use href="#i-back" /></svg> Tous les restaurants</a>

    @if (loading()) {
      <p class="mt-3">Chargement...</p>
    } @else if (error()) {
      <div class="alert alert-danger mt-3">{{ error() }}</div>
    } @else if (menu(); as m) {
      <header class="mn-head" [class.has-img]="m.restaurant.image && m.restaurant.image.startsWith('http')">
        @if (m.restaurant.image && m.restaurant.image.startsWith('http')) {
          <img [src]="m.restaurant.image" [alt]="m.restaurant.nom" />
        }
        <div class="mn-head__in">
          <div class="mn-head__tags">
            <span class="mn-tag">{{ m.restaurant.typeCuisine }}</span>
            <span class="mn-tag" [class.is-open]="m.restaurant.isOpen">
              <i></i>{{ m.restaurant.isOpen ? 'Ouvert' : 'Fermé' }}
            </span>
          </div>
          <h1>{{ m.restaurant.nom }}</h1>
          <p>{{ m.restaurant.description }}</p>
          <ul>
            <li><svg width="16" height="16"><use href="#i-pin" /></svg>{{ m.restaurant.adresse }}</li>
            @if (m.restaurant.horaires) {
              <li><svg width="16" height="16"><use href="#i-clock" /></svg>{{ m.restaurant.horaires }}</li>
            }
            <li><svg width="16" height="16"><use href="#i-truck" /></svg>Livraison {{ m.restaurant.fraisLivraison }} DT</li>
          </ul>
        </div>
      </header>

      @if (!m.restaurant.isOpen) {
        <div class="alert alert-warning">Ce restaurant est actuellement fermé.</div>
      }
      @if (cartError()) {
        <div class="alert alert-danger py-2">{{ cartError() }}</div>
      }
      @if (notice()) {
        <div class="alert alert-success py-2">
          {{ notice() }} <a routerLink="/cart" class="alert-link">Voir le panier</a>
        </div>
      }

      <div class="mn-bar">
        <div class="mn-search">
          <svg width="18" height="18"><use href="#i-search" /></svg>
          <input placeholder="Rechercher un plat dans ce menu..." aria-label="Rechercher dans le menu"
                 [ngModel]="search()" (ngModelChange)="search.set($event)" />
        </div>
        @if (m.categories.length > 0) {
          <div class="mn-chips">
            <button type="button" [class.on]="selected() === ''" (click)="selected.set('')">Tout</button>
            @for (c of m.categories; track c._id) {
              <button type="button" [class.on]="selected() === c._id" (click)="selected.set(c._id)">{{ c.nom }}</button>
            }
          </div>
        }
      </div>

      @if (m.categories.length === 0) {
        <div class="dx-empty"><b>Ce restaurant n'a pas encore publié son menu.</b></div>
      } @else if (visible().length === 0) {
        <div class="dx-empty"><b>Aucun plat ne correspond à votre recherche.</b></div>
      }

      @for (c of visible(); track c._id) {
        <section class="mn-sec">
          <div class="mn-sec__h">
            <h2>{{ c.nom }}</h2>
            <span>{{ c.dishes.length }}</span>
          </div>
          @if (c.description) { <p class="mn-sec__d">{{ c.description }}</p> }

          <div class="mn-list">
            @for (d of c.dishes; track d._id) {
              <article class="mn-dish" [class.is-off]="!d.disponible">
                <div class="mn-dish__img">
                  @if (d.image && d.image.startsWith('http')) {
                    <img [src]="d.image" [alt]="d.nom" loading="lazy" />
                  } @else {
                    <svg width="30" height="30"><use href="#i-pizza" /></svg>
                  }
                </div>
                <div class="mn-dish__txt">
                  <div class="mn-dish__row">
                    <h3>{{ d.nom }}</h3>
                    <i class="mn-dots"></i>
                    <strong>{{ d.prix }} DT</strong>
                  </div>
                  <p>{{ d.description }}</p>
                  <div class="mn-dish__foot">
                    @if (d.disponible) {
                      @if (auth.user()?.role === 'client') {
                        @if (m.restaurant.isOpen) {
                          <button class="mn-add" type="button" (click)="addToCart(d)">
                            <svg width="16" height="16"><use href="#i-bag" /></svg>
                            Ajouter
                            @if (cart.quantiteOf(d._id) > 0) { <b>{{ cart.quantiteOf(d._id) }}</b> }
                          </button>
                        }
                      } @else if (!auth.isLoggedIn()) {
                        <a class="mn-add mn-add--ghost" routerLink="/login">Se connecter pour commander</a>
                      }
                    } @else {
                      <span class="mn-off">Indisponible</span>
                    }
                  </div>
                </div>
              </article>
            }
          </div>
        </section>
      }
    }
  `,
})
export class RestaurantDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private service = inject(RestaurantService);
    auth = inject(AuthService);
  cart = inject(CartService);
  notice = signal('');
  cartError = signal('');
  menu = signal<Menu | null>(null);
  loading = signal(true);
  error = signal('');
  search = signal('');
  selected = signal(''); // '' = toutes les catégories

  // Catégories filtrées (recherche + onglet), sans les catégories vides
  visible = computed(() => {
    const m = this.menu();
    if (!m) return [];
    const q = this.search().trim().toLowerCase();
    return m.categories
      .filter((c) => !this.selected() || c._id === this.selected())
      .map((c) => ({
        ...c,
        dishes: c.dishes.filter(
          (d) => !q || d.nom.toLowerCase().includes(q) || (d.description || '').toLowerCase().includes(q)
        ),
      }))
      .filter((c) => c.dishes.length > 0);
  });
    // Un panier ne contient que les plats d'un seul restaurant : on demande confirmation avant de le remplacer
  addToCart(dish: Dish, remplacer = false) {
    const r = this.menu()?.restaurant;
    if (!r || !dish.disponible || !r.isOpen) return;
    this.notice.set('');
    this.cartError.set('');
    this.cart.ajouterPlat(dish._id, remplacer).subscribe({
      next: () => this.notice.set(`« ${dish.nom} » ajouté au panier.`),
      error: (err) => {
        if (err.status === 409 && err.error?.code === 'AUTRE_RESTAURANT') {
          if (confirm("Votre panier contient des plats d'un autre restaurant. Le vider et commencer un nouveau panier ?")) {
            this.addToCart(dish, true);
          }
        } else {
          this.cartError.set(err.error?.message || "Impossible d'ajouter ce plat au panier.");
        }
      },
    });
  }
  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.service.getMenu(id).subscribe({
      next: (m) => {
        this.menu.set(m);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.status === 404 ? 'Restaurant introuvable.' : 'Impossible de charger le menu.');
        this.loading.set(false);
      },
    });
  }
}
