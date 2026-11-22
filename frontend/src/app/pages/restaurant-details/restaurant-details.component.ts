import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Menu, RestaurantService } from '../../core/services/restaurant.service';

@Component({
  selector: 'app-restaurant-details',
  imports: [FormsModule, RouterLink],
  template: `
    <a routerLink="/restaurants" class="text-decoration-none">← Tous les restaurants</a>

    @if (loading()) {
      <p class="mt-3">Chargement...</p>
    } @else if (error()) {
      <div class="alert alert-danger mt-3">{{ error() }}</div>
    } @else if (menu(); as m) {
      <div class="card shadow-sm my-3">
        <div class="row g-0">
          @if (m.restaurant.image && m.restaurant.image.startsWith('http')) {
            <div class="col-md-3">
              <img [src]="m.restaurant.image" [alt]="m.restaurant.nom"
                   class="img-fluid rounded-start h-100 w-100" style="object-fit:cover;min-height:140px" />
            </div>
          }
          <div class="col">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <h2 class="card-title mb-1">{{ m.restaurant.nom }}</h2>
                <span class="badge" [class]="m.restaurant.isOpen ? 'bg-success' : 'bg-secondary'">
                  {{ m.restaurant.isOpen ? 'Ouvert' : 'Fermé' }}
                </span>
              </div>
              <h6 class="text-muted">{{ m.restaurant.typeCuisine }}</h6>
              <p class="card-text">{{ m.restaurant.description }}</p>
              <ul class="list-unstyled small mb-0">
                <li>📍 {{ m.restaurant.adresse }}</li>
                @if (m.restaurant.horaires) { <li>🕒 {{ m.restaurant.horaires }}</li> }
                <li>🚚 Livraison : {{ m.restaurant.fraisLivraison }} DT</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      @if (!m.restaurant.isOpen) {
        <div class="alert alert-warning">Ce restaurant est actuellement fermé.</div>
      }

      <div class="row g-2 mb-3">
        <div class="col-md-6">
          <input class="form-control" placeholder="Rechercher un plat dans ce menu..."
                 [ngModel]="search()" (ngModelChange)="search.set($event)" />
        </div>
      </div>

      @if (m.categories.length > 0) {
        <div class="d-flex flex-wrap gap-2 mb-4">
          <button class="btn btn-sm" [class]="selected() === '' ? 'btn-primary' : 'btn-outline-primary'"
                  (click)="selected.set('')">Tout</button>
          @for (c of m.categories; track c._id) {
            <button class="btn btn-sm" [class]="selected() === c._id ? 'btn-primary' : 'btn-outline-primary'"
                    (click)="selected.set(c._id)">{{ c.nom }}</button>
          }
        </div>
      }

      @if (m.categories.length === 0) {
        <div class="alert alert-info">Ce restaurant n'a pas encore publié son menu.</div>
      } @else if (visible().length === 0) {
        <div class="alert alert-info">Aucun plat ne correspond à votre recherche.</div>
      }

      @for (c of visible(); track c._id) {
        <section class="mb-4">
          <h4 class="border-bottom pb-1">{{ c.nom }}</h4>
          @if (c.description) { <p class="text-muted small">{{ c.description }}</p> }
          <div class="row g-3">
            @for (d of c.dishes; track d._id) {
              <div class="col-md-6">
                <div class="card h-100" [class.opacity-50]="!d.disponible">
                  <div class="card-body d-flex gap-3">
                    @if (d.image && d.image.startsWith('http')) {
                      <img [src]="d.image" [alt]="d.nom" class="rounded"
                           style="width:90px;height:90px;object-fit:cover" />
                    }
                    <div class="flex-grow-1">
                      <div class="d-flex justify-content-between">
                        <h6 class="mb-1">{{ d.nom }}</h6>
                        <strong class="text-nowrap">{{ d.prix }} DT</strong>
                      </div>
                      <p class="small text-muted mb-2">{{ d.description }}</p>
                      @if (d.disponible) {
                        <span class="badge bg-success-subtle text-success-emphasis">Disponible</span>
                      } @else {
                        <span class="badge bg-secondary">Indisponible</span>
                      }
                      <!-- Personne 3 (panier) : ajouter ici le bouton « Ajouter au panier »,
                           à afficher seulement si d.disponible (règle : plat indisponible = non commandable). -->
                    </div>
                  </div>
                </div>
              </div>
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
