import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Dish, DishForm, DishService } from '../../core/services/dish.service';
import { MenuCategory, Restaurant, RestaurantService } from '../../core/services/restaurant.service';

const emptyForm = (): DishForm => ({
  nom: '', description: '', prix: null, image: '', disponible: true, categorie: '',
});

@Component({
  selector: 'app-manage-dishes',
  imports: [FormsModule, RouterLink],
  template: `
    <h2 class="mb-3">Plats du menu</h2>

    @if (loading()) {
      <p>Chargement...</p>
    } @else if (!restaurant()) {
      <div class="alert alert-info">Créez d'abord votre restaurant pour gérer son menu.</div>
      <a class="btn btn-primary" routerLink="/create-restaurant">Créer mon restaurant</a>
    } @else if (categories().length === 0) {
      <div class="alert alert-warning">Créez d'abord au moins une catégorie pour pouvoir ajouter des plats.</div>
      <a class="btn btn-primary" routerLink="/restaurant-dashboard/categories">Gérer les catégories</a>
    } @else {
      @if (error()) { <div class="alert alert-danger">{{ error() }}</div> }
      @if (success()) { <div class="alert alert-success">{{ success() }}</div> }

      <div class="card mb-4">
        <div class="card-body">
          <h5 class="card-title">{{ editingId() ? 'Modifier le plat' : 'Ajouter un plat' }}</h5>
          <form class="row g-2" (ngSubmit)="submit()">
            <div class="col-md-4">
              <label class="form-label small mb-0">Nom *</label>
              <input class="form-control" name="nom" [(ngModel)]="form.nom" required />
            </div>
            <div class="col-md-3">
              <label class="form-label small mb-0">Catégorie *</label>
              <select class="form-select" name="categorie" [(ngModel)]="form.categorie" required>
                <option value="">Choisir...</option>
                @for (c of categories(); track c._id) { <option [value]="c._id">{{ c.nom }}</option> }
              </select>
            </div>
            <div class="col-md-2">
              <label class="form-label small mb-0">Prix (DT) *</label>
              <input class="form-control" type="number" min="0" step="0.1" name="prix" [(ngModel)]="form.prix" required />
            </div>
            <div class="col-md-3 d-flex align-items-end">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" id="dispo" name="disponible" [(ngModel)]="form.disponible" />
                <label class="form-check-label" for="dispo">Disponible</label>
              </div>
            </div>
            <div class="col-md-6">
              <label class="form-label small mb-0">Description</label>
              <input class="form-control" name="description" [(ngModel)]="form.description" />
            </div>
            <div class="col-md-6">
              <label class="form-label small mb-0">Image (URL)</label>
              <input class="form-control" name="image" [(ngModel)]="form.image" placeholder="https://..." />
            </div>
            <div class="col-12 d-flex gap-2">
              <button class="btn btn-primary" [disabled]="saving()">
                {{ editingId() ? 'Enregistrer' : 'Ajouter le plat' }}
              </button>
              @if (editingId()) {
                <button type="button" class="btn btn-outline-secondary" (click)="cancelEdit()">Annuler</button>
              }
            </div>
          </form>
        </div>
      </div>

      <div class="row g-2 mb-3">
        <div class="col-md-5">
          <input class="form-control" placeholder="Rechercher un plat..."
                 [ngModel]="search()" (ngModelChange)="search.set($event)" />
        </div>
        <div class="col-md-3">
          <select class="form-select" [ngModel]="filterCategory()" (ngModelChange)="filterCategory.set($event)">
            <option value="">Toutes les catégories</option>
            @for (c of categories(); track c._id) { <option [value]="c._id">{{ c.nom }}</option> }
          </select>
        </div>
      </div>

      @if (filtered().length === 0) {
        <div class="alert alert-info">Aucun plat à afficher.</div>
      } @else {
        <div class="table-responsive">
          <table class="table align-middle">
            <thead>
              <tr><th>Plat</th><th>Catégorie</th><th class="text-end">Prix</th><th class="text-center">Disponibilité</th><th class="text-end">Actions</th></tr>
            </thead>
            <tbody>
              @for (row of filtered(); track row.dish._id) {
                <tr [class.table-light]="!row.dish.disponible">
                  <td>
                    <div class="fw-semibold">{{ row.dish.nom }}</div>
                    <div class="small text-muted">{{ row.dish.description }}</div>
                  </td>
                  <td>{{ row.category }}</td>
                  <td class="text-end text-nowrap">{{ row.dish.prix }} DT</td>
                  <td class="text-center">
                    <button class="btn btn-sm" [class]="row.dish.disponible ? 'btn-success' : 'btn-secondary'"
                            (click)="toggle(row.dish)">
                      {{ row.dish.disponible ? 'Disponible' : 'Indisponible' }}
                    </button>
                  </td>
                  <td class="text-end text-nowrap">
                    <button class="btn btn-sm btn-outline-primary me-1" (click)="edit(row.dish)">Modifier</button>
                    <button class="btn btn-sm btn-outline-danger" (click)="remove(row.dish)">Supprimer</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    }
  `,
})
export class ManageDishesComponent implements OnInit {
  private restaurants = inject(RestaurantService);
  private service = inject(DishService);

  restaurant = signal<Restaurant | null>(null);
  categories = signal<MenuCategory[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  success = signal('');
  editingId = signal<string | null>(null);
  form: DishForm = emptyForm();

  search = signal('');
  filterCategory = signal('');

  // Liste à plat des plats (avec le nom de leur catégorie), filtrée
  filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    return this.categories()
      .filter((c) => !this.filterCategory() || c._id === this.filterCategory())
      .flatMap((c) => c.dishes.map((dish) => ({ dish, category: c.nom })))
      .filter(({ dish }) => !q || dish.nom.toLowerCase().includes(q) || (dish.description || '').toLowerCase().includes(q));
  });

  ngOnInit() {
    this.restaurants.getMine().subscribe({
      next: (r) => {
        this.restaurant.set(r);
        if (r) this.reload();
        else this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger votre restaurant.');
        this.loading.set(false);
      },
    });
  }

  private reload() {
    this.restaurants.getMenu(this.restaurant()!._id).subscribe({
      next: (m) => {
        this.categories.set(m.categories);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Impossible de charger le menu.');
        this.loading.set(false);
      },
    });
  }

  submit() {
    this.error.set('');
    this.success.set('');
    if (!this.form.nom.trim()) return this.error.set('Le nom du plat est obligatoire');
    if (!this.form.categorie) return this.error.set('Choisissez une catégorie');
    if (this.form.prix === null || this.form.prix < 0) return this.error.set('Le prix doit être un nombre positif ou nul');

    this.saving.set(true);
    const id = this.editingId();
    const request = id ? this.service.update(id, this.form) : this.service.create(this.form);
    request.subscribe({
      next: () => {
        this.success.set(id ? 'Plat modifié.' : 'Plat ajouté.');
        this.cancelEdit();
        this.saving.set(false);
        this.reload();
      },
      error: (err) => {
        this.error.set(err.error?.message || "Erreur lors de l'enregistrement");
        this.saving.set(false);
      },
    });
  }

  edit(d: Dish) {
    this.editingId.set(d._id);
    this.form = {
      nom: d.nom, description: d.description, prix: d.prix, image: d.image,
      disponible: d.disponible, categorie: d.categorie,
    };
    this.error.set('');
    this.success.set('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() {
    this.editingId.set(null);
    this.form = emptyForm();
  }

  toggle(d: Dish) {
    this.error.set('');
    this.service.setAvailability(d._id, !d.disponible).subscribe({
      next: () => this.reload(),
      error: (err) => this.error.set(err.error?.message || 'Modification impossible'),
    });
  }

  remove(d: Dish) {
    if (!confirm(`Supprimer le plat « ${d.nom} » ?`)) return;
    this.error.set('');
    this.success.set('');
    this.service.remove(d._id).subscribe({
      next: () => {
        this.success.set('Plat supprimé.');
        this.reload();
      },
      error: (err) => this.error.set(err.error?.message || 'Suppression impossible'),
    });
  }
}
