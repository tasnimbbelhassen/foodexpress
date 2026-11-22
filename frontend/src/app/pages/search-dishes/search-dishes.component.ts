import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DishSearchItem, DishService } from '../../core/services/dish.service';

@Component({
  selector: 'app-search-dishes',
  imports: [FormsModule, RouterLink],
  template: `
    <h2 class="mb-3">Rechercher un plat</h2>

    <div class="row g-2 mb-4 align-items-center">
      <div class="col-md-6">
        <input class="form-control" placeholder="Ex : pizza, couscous, tiramisu..."
               [(ngModel)]="search" (keyup.enter)="applyFilters()" />
      </div>
      <div class="col-md-3">
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="dispo"
                 [(ngModel)]="onlyAvailable" (ngModelChange)="applyFilters()" />
          <label class="form-check-label" for="dispo">Disponibles uniquement</label>
        </div>
      </div>
      <div class="col-md-2">
        <button class="btn btn-primary w-100" (click)="applyFilters()">Rechercher</button>
      </div>
    </div>

    @if (error()) { <div class="alert alert-danger">{{ error() }}</div> }
    @if (loading()) { <p>Chargement...</p> }
    @if (!loading() && !error() && dishes().length === 0) {
      <div class="alert alert-info">Aucun plat trouvé.</div>
    }

    <div class="row g-3">
      @for (d of dishes(); track d._id) {
        <div class="col-md-6">
          <div class="card h-100" [class.opacity-50]="!d.disponible">
            <div class="card-body d-flex gap-3">
              @if (d.image && d.image.startsWith('http')) {
                <img [src]="d.image" [alt]="d.nom" class="rounded" style="width:90px;height:90px;object-fit:cover" />
              }
              <div class="flex-grow-1">
                <div class="d-flex justify-content-between">
                  <h6 class="mb-1">{{ d.nom }}</h6>
                  <strong class="text-nowrap">{{ d.prix }} DT</strong>
                </div>
                <p class="small text-muted mb-1">{{ d.description }}</p>
                <p class="small mb-1">
                  <span class="badge bg-light text-dark border">{{ d.categorie.nom }}</span>
                  chez <a [routerLink]="['/restaurants', d.restaurant._id]">{{ d.restaurant.nom }}</a>
                </p>
                @if (!d.disponible) { <span class="badge bg-secondary">Indisponible</span> }
              </div>
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
export class SearchDishesComponent implements OnInit {
  private service = inject(DishService);

  search = '';
  onlyAvailable = false;
  limit = 10;

  page = signal(1);
  dishes = signal<DishSearchItem[]>([]);
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
