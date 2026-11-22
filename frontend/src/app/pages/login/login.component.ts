import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="row justify-content-center">
      <div class="col-md-5">
        <h2 class="mb-3">Connexion</h2>
        @if (error()) { <div class="alert alert-danger">{{ error() }}</div> }
        <form (ngSubmit)="submit()">
          <div class="mb-3">
            <label class="form-label">Email</label>
            <input class="form-control" type="email" name="email" [(ngModel)]="email" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Mot de passe</label>
            <input class="form-control" type="password" name="password" [(ngModel)]="password" required />
          </div>
          <button class="btn btn-primary w-100" [disabled]="loading()">
            {{ loading() ? 'Connexion...' : 'Se connecter' }}
          </button>
        </form>
        <p class="mt-3">Pas de compte ? <a routerLink="/register">S'inscrire</a></p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  submit() {
    this.error.set('');
    this.loading.set(true);
    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigate(['/restaurants']),
      error: (err) => {
        this.error.set(err.error?.message || 'Erreur de connexion');
        this.loading.set(false);
      },
    });
  }
}