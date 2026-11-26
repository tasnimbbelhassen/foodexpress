import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RestaurantService } from '../../core/services/restaurant.service';

@Component({
  selector: 'app-create-restaurant',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="row justify-content-center">
      <div class="col-md-7">
        <h2 class="mb-3">Créer mon restaurant</h2>

        <!-- Vérification de l'existence d'un restaurant -->
        @if (checking()) {
          <p>Chargement...</p>
        } @else if (hasRestaurant()) {
          <div class="alert alert-info">
            Vous avez déjà un restaurant : un restaurateur ne peut en avoir qu'un seul.
          </div>
          <a class="btn btn-primary" routerLink="/restaurants">Voir les restaurants</a>
        } @else {
          <!-- Formulaire de création du restaurant -->
          <p class="text-muted">Dernière étape : renseignez les informations de votre restaurant.</p>
          @if (error()) { <div class="alert alert-danger">{{ error() }}</div> }
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
                <option value="">Choisir...</option>
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
                <input class="form-control" type="number" min="0" name="fraisLivraison" [(ngModel)]="form.fraisLivraison" />
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
            <button class="btn btn-primary w-100" [disabled]="loading()">
              {{ loading() ? 'Création...' : 'Créer le restaurant' }}
            </button>
          </form>
        }
      </div>
    </div>
  `,
})
export class CreateRestaurantComponent implements OnInit {
  private service = inject(RestaurantService);
  private router = inject(Router);

  // Types de cuisine proposés dans le formulaire
  cuisines = ['Italienne', 'Tunisienne', 'Fast-food', 'Pizza'];

  // Données du formulaire
  form = {
    nom: '', description: '', adresse: '', typeCuisine: '',
    image: '', fraisLivraison: 0, horaires: '', isOpen: true,
  };

  // États de vérification, de création et de gestion des erreurs
  checking = signal(true);
  hasRestaurant = signal(false);
  loading = signal(false);
  error = signal('');

  // Vérifie si le restaurateur possède déjà un restaurant
  ngOnInit() {
    this.service.getMine().subscribe({
      next: (r) => {
        this.hasRestaurant.set(!!r);
        this.checking.set(false);
      },
      error: () => this.checking.set(false),
    });
  }

  // Vérifie les champs obligatoires et crée le restaurant
  submit() {
    this.error.set('');
    if (!this.form.nom.trim() || !this.form.adresse.trim() || !this.form.typeCuisine) {
      return this.error.set('Nom, adresse et type de cuisine sont obligatoires');
    }
    this.loading.set(true);
    this.service.create(this.form).subscribe({
      next: () => this.router.navigate(['/restaurants']),
      error: (err) => {
        this.error.set(err.error?.message || 'Erreur lors de la création');
        this.loading.set(false);
      },
    });
  }
}