import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Restaurant, RestaurantService } from '../../core/services/restaurant.service';

@Component({
  selector: 'app-restaurants',
  imports: [FormsModule, RouterLink],
  template: `
    <h2 class="mb-3">Restaurants</h2>

    <div class="row g-2 mb-4 align-items-end">
      <div class="col-md-4">
        <input class="form-control" placeholder="Rechercher par nom..."
               [(ngModel)]="search" (keyup.enter)="applyFilters()" />
      </div>
      <div class="col-md-3">
        <select class="form-select" [(ngModel)]="cuisine" (ngModelChange)="applyFilters()">
          <option value="">Toutes les cuisines</option>
          @for (c of cuisines; track c) { <option [value]="c">{{ c }}</option> }
        </select>
      </div>
      <div class="col-md-2">
        <select class="form-select" [(ngModel)]="sort" (ngModelChange)="applyFilters()">
          <option value="nom">A → Z</option>
          <option value="-nom">Z → A</option>
        </select>
      </div>
      <div class="col-md-2">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="open"
                 [(ngModel)]="open" (ngModelChange)="applyFilters()" />
          <label class="form-check-label" for="open">Ouverts</label>
        </div>
      </div>
      <div class="col-md-1">
        <button class="btn btn-primary w-100" (click)="applyFilters()">OK</button>
      </div>
    </div>

    @if (error()) { <div class="alert alert-danger">{{ error() }}</div> }
    @if (loading()) { <p>Chargement...</p> }

    @if (!loading() && restaurants().length === 0 && !error()) {
      <div class="alert alert-info">Aucun restaurant trouvé.</div>
    }

    <div class="row g-3">
      @for (r of restaurants(); track r._id) {
        <div class="col-md-4">
          <div class="card h-100 shadow-sm">
            @if (r.image && r.image.startsWith('http')) {
              <img [src]="r.image" class="card-img-top" [alt]="r.nom" style="height:160px;object-fit:cover" />
            }
            <div class="card-body">
              <div class="d-flex justify-content-between">
                <h5 class="card-title">{{ r.nom }}</h5>
                <span class="badge" [class]="r.isOpen ? 'bg-success' : 'bg-secondary'">
                  {{ r.isOpen ? 'Ouvert' : 'Fermé' }}
                </span>
              </div>
              <h6 class="text-muted">{{ r.typeCuisine }}</h6>
              <p class="card-text">{{ r.description }}</p>
              <ul class="list-unstyled small mb-0">
                <li>📍 {{ r.adresse }}</li>
                <li>🕒 {{ r.horaires }}</li>
                <li>🚚 Livraison : {{ r.fraisLivraison }} DT</li>
              </ul>
            </div>
            <div class="card-footer bg-transparent border-0 pt-0">
              <a class="btn btn-outline-primary btn-sm w-100" [routerLink]="['/restaurants', r._id]">Voir le menu</a>
            </div>
          </div>
        </div>
      }
    </div>

    @if (totalPages() > 1) {
      <nav class="d-flex justify-content-center align-items-center gap-3 mt-4">
        <button class="btn btn-outline-primary" [disabled]="page() <= 1" (click)="goTo(page() - 1)">Précédent</button>
        <span>Page {{ page() }} / {{ totalPages() }} ({{ total() }} résultats)</span>
        <button class="btn btn-outline-primary" [disabled]="page() >= totalPages()" (click)="goTo(page() + 1)">Suivant</button>
      </nav>
    }
  `,
})
export class RestaurantsComponent implements OnInit {
  private service = inject(RestaurantService);

  cuisines = ['Italienne', 'Tunisienne', 'Fast-food', 'Pizza'];

  search = '';
  cuisine = '';
  open = false;
  sort = 'nom';
  limit = 6;

  page = signal(1);
  restaurants = signal<Restaurant[]>([]);
  total = signal(0);
  totalPages = signal(1);
  loading = signal(false);
  error = signal('');

  ngOnInit() {
    this.load();
  }

  applyFilters() {
    this.page.set(1);
    this.load();
  }

  goTo(p: number) {
    this.page.set(p);
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set('');
    this.service
      .getAll({
        search: this.search,
        cuisine: this.cuisine,
        open: this.open,
        sort: this.sort,
        page: this.page(),
        limit: this.limit,
      })
      .subscribe({
        next: (res) => {
          this.restaurants.set(res.data);
          this.total.set(res.total);
          this.totalPages.set(res.totalPages);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Impossible de charger les restaurants (le serveur tourne-t-il ?)');
          this.loading.set(false);
        },
      });
  }
}