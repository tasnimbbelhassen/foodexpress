import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RestaurantService } from '../../core/services/restaurant.service';

@Component({
  selector: 'app-manage-restaurant',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="row justify-content-center">
      <div class="col-md-7">
        <h2 class="mb-3">Mon restaurant</h2>

        <!-- Vérification du chargement et de l'existence du restaurant -->
        @if (loading()) {
          <p>Chargement...</p>
        } @else if (!restaurantId) {
          <div class="alert alert-info">Vous n'avez pas encore de restaurant.</div>
          <a class="btn btn-primary" routerLink="/create-restaurant">Créer mon restaurant</a>
        } @else {
          <!-- Affichage des messages d'erreur et de confirmation -->
          @if (error()) { <div class="alert alert-danger">{{ error() }}</div> }
          @if (success()) { <div class="alert alert-success">{{ success() }}</div> }

          <!-- Formulaire de modification des informations du restaurant -->
          <form (ngSubmit)="submit()">
            <div class="mb-3">
              <label class="form-label">Nom *</label>
              <input class="form-control" name="nom" [(ngModel)]="form.nom" required />
            </div>
            <div class="mb-3">
              <label class="form-label">Description</label>
              <textarea class="form-control" name="description" [(ngModel)]="form.description"></textarea>
            </div>
            <div class="mb-3">
              <label class="form-label">Adresse *</label>
              <input class="form-control" name="adresse" [(ngModel)]="form.adresse" required />
            </div>
            <div class="mb-3">
              <label class="form-label">Type de cuisine *</label>
              <select class="form-select" name="typeCuisine" [(ngModel)]="form.typeCuisine" required>
                @for (c of cuisines; track c) { <option [value]="c">{{ c }}</option> }
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">Image (URL)</label>
              <input class="form-control" name="image" [(ngModel)]="form.image" placeholder="https://..." />
            </div>
            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label">Frais de livraison (DT)</label>
                <input class="form-control" type="number" min="0" step="0.5" name="fraisLivraison"
                       [(ngModel)]="form.fraisLivraison" />
              </div>
              <div class="col-md-6 mb-3">
                <label class="form-label">Horaires</label>
                <input class="form-control" name="horaires" [(ngModel)]="form.horaires" placeholder="10:00 - 23:00" />
              </div>
            </div>
            <div class="form-check mb-3">
              <input class="form-check-input" type="checkbox" id="isOpen" name="isOpen" [(ngModel)]="form.isOpen" />
              <label class="form-check-label" for="isOpen">Ouvert actuellement</label>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-primary flex-grow-1" [disabled]="saving()">
                {{ saving() ? 'Enregistrement...' : 'Enregistrer les modifications' }}
              </button>
              <a class="btn btn-outline-secondary" [routerLink]="['/restaurants', restaurantId]">Voir ma page</a>
            </div>
          </form>
        }
      </div>
    </div>
  `,
})
export class ManageRestaurantComponent implements OnInit {
  private service = inject(RestaurantService);

  // Types de cuisine proposés dans le formulaire
  cuisines = ['Italienne', 'Tunisienne', 'Fast-food', 'Pizza'];
  restaurantId = '';
  form = {
    nom: '', description: '', adresse: '', typeCuisine: '',
    image: '', fraisLivraison: 0, horaires: '', isOpen: true,
  };

  // États du chargement, de l'enregistrement et des messages
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  success = signal('');

  // Récupération des informations du restaurant existant
  ngOnInit() {
    this.service.getMine().subscribe({
      next: (r) => {
        if (r) {
          this.restaurantId = r._id;
          this.form = {
            nom: r.nom, description: r.description, adresse: r.adresse, typeCuisine: r.typeCuisine,
            image: r.image, fraisLivraison: r.fraisLivraison, horaires: r.horaires, isOpen: r.isOpen,
          };
          // Un type de cuisine absent de la liste reste sélectionnable
          if (!this.cuisines.includes(r.typeCuisine)) this.cuisines = [...this.cuisines, r.typeCuisine];
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger votre restaurant.');
        this.loading.set(false);
      },
    });
  }

  // Vérification et enregistrement des modifications
  submit() {
    this.error.set('');
    this.success.set('');
    if (!this.form.nom.trim() || !this.form.adresse.trim() || !this.form.typeCuisine) {
      return this.error.set('Nom, adresse et type de cuisine sont obligatoires');
    }
    if (this.form.fraisLivraison < 0) {
      return this.error.set('Les frais de livraison ne peuvent pas être négatifs');
    }
    this.saving.set(true);
    this.service.update(this.restaurantId, this.form).subscribe({
      next: () => {
        this.success.set('Restaurant mis à jour.');
        this.saving.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Erreur lors de la mise à jour');
        this.saving.set(false);
      },
    });
  }
}