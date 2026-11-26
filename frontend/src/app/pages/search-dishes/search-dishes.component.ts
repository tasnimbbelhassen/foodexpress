import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DishSearchItem, DishService } from '../../core/services/dish.service';

@Component({
  selector: 'app-search-dishes',
  imports: [FormsModule, RouterLink],
  template: `
    <!-- Barre de recherche des plats -->
    <section class="dx-hero">
      <h1>Quel plat vous fait <span>envie</span> ?</h1>
      <p>Cherchez parmi tous les menus, puis filez directement chez le restaurant.</p>

      <div class="dx-search">
        <svg width="20" height="20"><use href="#i-search" /></svg>
        <input placeholder="Ex : pizza, couscous, tiramisu..." aria-label="Rechercher un plat"
               [(ngModel)]="search" (keyup.enter)="applyFilters()" />
        <button type="button" (click)="applyFilters()">Rechercher</button>
      </div>

      <!-- Filtre pour afficher uniquement les plats disponibles -->
      <label class="dx-switch" for="dispo">
        <input type="checkbox" id="dispo" [(ngModel)]="onlyAvailable" (ngModelChange)="applyFilters()" />
        <i></i> Disponibles uniquement
      </label>
    </section>

    <!-- Affichage des erreurs et de l'état de chargement -->
    @if (error()) { <div class="alert alert-danger">{{ error() }}</div> }
    @if (loading()) { <p class="dx-state">Chargement...</p> }
    @if (!loading() && !error() && dishes().length === 0) {
      <div class="dx-empty">
        <svg width="34" height="34"><use href="#i-search" /></svg>
        <b>Aucun plat trouvé.</b>
        <span>Essayez un autre mot, ou retirez le filtre.</span>
      </div>
    }

    <!-- Titre et nombre de plats trouvés -->
    @if (!loading() && dishes().length > 0) {
      <div class="dx-listh">
        <h2>Tous les plats</h2>
        <span>{{ total() }}</span>
      </div>
    }

    <!-- Affichage des résultats sous forme de cartes -->
    <div class="dx-grid">
      @for (d of dishes(); track d._id) {
        <article class="dx-card" [class.is-off]="!d.disponible">
          <div class="dx-card__img">
            @if (d.image && d.image.startsWith('http')) {
              <img [src]="d.image" [alt]="d.nom" loading="lazy" />
            } @else {
              <span class="dx-card__ph"><svg width="44" height="44"><use href="#i-pizza" /></svg></span>
            }
            <strong class="dx-card__price">{{ d.prix }} DT</strong>
            @if (!d.disponible) { <em class="dx-card__off">Indisponible</em> }
          </div>
          <div class="dx-card__body">
            <span class="dx-card__cat">{{ d.categorie.nom }}</span>
            <h3>{{ d.nom }}</h3>
            <p>{{ d.description }}</p>
            <a class="dx-card__resto" [routerLink]="['/restaurants', d.restaurant._id]">
              <svg width="16" height="16"><use href="#i-pin" /></svg>
              <span>chez <b>{{ d.restaurant.nom }}</b></span>
              <svg class="dx-card__go" width="16" height="16"><use href="#i-arrow" /></svg>
            </a>
          </div>
        </article>
      }
    </div>

    <!-- Navigation entre les pages de résultats -->
    @if (totalPages() > 1) {
      <nav class="dx-pager" aria-label="Pagination">
        <button type="button" [disabled]="page() <= 1" (click)="goTo(page() - 1)">Précédent</button>
        <span>Page {{ page() }} / {{ totalPages() }}</span>
        <button type="button" [disabled]="page() >= totalPages()" (click)="goTo(page() + 1)">Suivant</button>
      </nav>
    }
  `,
})
export class SearchDishesComponent implements OnInit {
  // Service de recherche des plats
  private service = inject(DishService);

  // Paramètres de recherche et de filtrage
  search = '';
  onlyAvailable = false;
  limit = 10;

  // Résultats et états de la recherche
  page = signal(1);
  dishes = signal<DishSearchItem[]>([]);
  total = signal(0);
  totalPages = signal(1);
  loading = signal(false);
  error = signal('');

  // Chargement initial des plats
  ngOnInit() {
    this.load();
  }

  // Applique les filtres et revient à la première page
  applyFilters() {
    this.page.set(1);
    this.load();
  }

  // Change la page des résultats
  goTo(p: number) {
    this.page.set(p);
    this.load();
  }

  // Récupère les plats correspondant aux critères de recherche
  load() {
    this.loading.set(true);
    this.error.set('');
    this.service
      .search({ search: this.search, disponible: this.onlyAvailable, page: this.page(), limit: this.limit })
      .subscribe({
        next: (res) => {
          this.dishes.set(res.data);
          this.total.set(res.total);
          this.totalPages.set(res.totalPages);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Impossible de charger les plats (le serveur tourne-t-il ?)');
          this.loading.set(false);
        },
      });
  }
}