import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CategoryService } from '../../core/services/category.service';
import { MenuCategory, Restaurant, RestaurantService } from '../../core/services/restaurant.service';

@Component({
  selector: 'app-manage-categories',
  imports: [FormsModule, RouterLink],
  template: `
    <h2 class="mb-3">Catégories du menu</h2>

    <!-- Vérification du chargement et de l'existence du restaurant -->
    @if (loading()) {
      <p>Chargement...</p>
    } @else if (!restaurant()) {
      <div class="alert alert-info">Créez d'abord votre restaurant pour gérer son menu.</div>
      <a class="btn btn-primary" routerLink="/create-restaurant">Créer mon restaurant</a>
    } @else {
      <!-- Affichage des messages d'erreur et de confirmation -->
      @if (error()) { <div class="alert alert-danger">{{ error() }}</div> }
      @if (success()) { <div class="alert alert-success">{{ success() }}</div> }

      <!-- Formulaire d'ajout ou de modification d'une catégorie -->
      <div class="card mb-4">
        <div class="card-body">
          <h5 class="card-title">{{ editingId() ? 'Modifier la catégorie' : 'Ajouter une catégorie' }}</h5>
          <form class="row g-2" (ngSubmit)="submit()">
            <div class="col-md-4">
              <input class="form-control" name="nom" placeholder="Nom (ex : Pizzas) *" [(ngModel)]="form.nom" required />
            </div>
            <div class="col-md-5">
              <input class="form-control" name="description" placeholder="Description (facultatif)" [(ngModel)]="form.description" />
            </div>
            <div class="col-md-3 d-flex gap-2">
              <button class="btn btn-primary flex-grow-1" [disabled]="saving()">
                {{ editingId() ? 'Enregistrer' : 'Ajouter' }}
              </button>
              @if (editingId()) {
                <button type="button" class="btn btn-outline-secondary" (click)="cancelEdit()">Annuler</button>
              }
            </div>
          </form>
        </div>
      </div>

      <!-- Liste des catégories et actions disponibles -->
      @if (categories().length === 0) {
        <div class="alert alert-info">Aucune catégorie pour le moment. Ajoutez-en une pour pouvoir créer des plats.</div>
      } @else {
        <div class="table-responsive">
          <table class="table align-middle">
            <thead>
              <tr><th>Nom</th><th>Description</th><th class="text-center">Plats</th><th class="text-end">Actions</th></tr>
            </thead>
            <tbody>
              @for (c of categories(); track c._id) {
                <tr>
                  <td class="fw-semibold">{{ c.nom }}</td>
                  <td class="text-muted">{{ c.description }}</td>
                  <td class="text-center">{{ c.dishes.length }}</td>
                  <td class="text-end text-nowrap">
                    <button class="btn btn-sm btn-outline-primary me-1" (click)="edit(c)">Modifier</button>
                    <button class="btn btn-sm btn-outline-danger" (click)="remove(c)"
                            [disabled]="c.dishes.length > 0"
                            [title]="c.dishes.length > 0 ? 'Videz la catégorie avant de la supprimer' : ''">
                      Supprimer
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <a class="btn btn-outline-primary" routerLink="/restaurant-dashboard/dishes">Gérer les plats →</a>
      }
    }
  `,
})
export class ManageCategoriesComponent implements OnInit {
  private restaurants = inject(RestaurantService);
  private service = inject(CategoryService);

  // États du restaurant, des catégories et des formulaires
  restaurant = signal<Restaurant | null>(null);
  categories = signal<MenuCategory[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  success = signal('');
  editingId = signal<string | null>(null);
  form = { nom: '', description: '' };

  // Récupération du restaurant au chargement du composant
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

  // Chargement des catégories du menu
  private reload() {
    this.restaurants.getMenu(this.restaurant()!._id).subscribe({
      next: (m) => {
        this.categories.set(m.categories);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Impossible de charger les catégories.');
        this.loading.set(false);
      },
    });
  }

  // Ajout ou modification d'une catégorie
  submit() {
    this.error.set('');
    this.success.set('');
    if (!this.form.nom.trim()) return this.error.set('Le nom de la catégorie est obligatoire');

    this.saving.set(true);
    const id = this.editingId();
    const request = id ? this.service.update(id, this.form) : this.service.create(this.form);
    request.subscribe({
      next: () => {
        this.success.set(id ? 'Catégorie modifiée.' : 'Catégorie ajoutée.');
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

  // Préparation du formulaire pour modifier une catégorie
  edit(c: MenuCategory) {
    this.editingId.set(c._id);
    this.form = { nom: c.nom, description: c.description };
    this.error.set('');
    this.success.set('');
  }

  // Réinitialisation du formulaire
  cancelEdit() {
    this.editingId.set(null);
    this.form = { nom: '', description: '' };
  }

  // Suppression d'une catégorie après confirmation
  remove(c: MenuCategory) {
    if (!confirm(`Supprimer la catégorie « ${c.nom} » ?`)) return;
    this.error.set('');
    this.success.set('');
    this.service.remove(c._id).subscribe({
      next: () => {
        this.success.set('Catégorie supprimée.');
        this.reload();
      },
      error: (err) => this.error.set(err.error?.message || 'Suppression impossible'),
    });
  }
}