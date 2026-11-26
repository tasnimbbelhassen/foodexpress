import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="row justify-content-center">
      <div class="col-md-6">
        <h2 class="mb-3">Inscription</h2>

        <!-- Affichage des erreurs -->
        @if (error()) { <div class="alert alert-danger">{{ error() }}</div> }

        <!-- Formulaire d'inscription -->
        <form (ngSubmit)="submit()">
          <div class="row">
            <div class="col-md-6 mb-3">
              <label class="form-label">Nom</label>
              <input class="form-control" name="nom" [(ngModel)]="form.nom" required />
            </div>
            <div class="col-md-6 mb-3">
              <label class="form-label">Prénom</label>
              <input class="form-control" name="prenom" [(ngModel)]="form.prenom" required />
            </div>
          </div>
          <div class="mb-3">
            <label class="form-label">Email</label>
            <input class="form-control" type="email" name="email" [(ngModel)]="form.email" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Téléphone</label>
            <input class="form-control" name="telephone" [(ngModel)]="form.telephone" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Mot de passe</label>
            <input class="form-control" type="password" name="password" [(ngModel)]="form.password" required />
            <div class="form-text">8 caractères minimum, avec lettres et chiffres.</div>
          </div>
          <div class="mb-3">
            <label class="form-label">Confirmation</label>
            <input class="form-control" type="password" name="confirmation" [(ngModel)]="form.confirmation" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Je m'inscris en tant que</label>
            <select class="form-select" name="role" [(ngModel)]="form.role">
              <option value="client">Client</option>
              <option value="restaurateur">Restaurateur</option>
            </select>
          </div>
          <button class="btn btn-primary w-100" [disabled]="loading()">
            {{ loading() ? 'Création...' : 'Créer mon compte' }}
          </button>
        </form>

        <!-- Lien vers la connexion -->
        <p class="mt-3">Déjà inscrit ? <a routerLink="/login">Se connecter</a></p>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  // Données saisies dans le formulaire
  form = {
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    password: '',
    confirmation: '',
    role: 'client',
  };

  // États de l'inscription
  loading = signal(false);
  error = signal('');

  // Vérification des champs et création du compte
  submit() {
    this.error.set('');
    if (Object.values(this.form).some((v) => !v.trim())) {
      return this.error.set('Tous les champs sont obligatoires');
    }
    if (this.form.password !== this.form.confirmation) {
      return this.error.set('La confirmation ne correspond pas au mot de passe');
    }
    this.loading.set(true);
    this.auth.register(this.form).subscribe({
      next: (res) =>
        this.router.navigate([res.user.role === 'restaurateur' ? '/create-restaurant' : '/restaurants']),
      error: (err) => {
        this.error.set(err.error?.message || "Erreur lors de l'inscription");
        this.loading.set(false);
      },
    });
  }
}