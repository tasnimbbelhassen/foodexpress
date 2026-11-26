import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  imports: [FormsModule],
  template: `
    <div class="row g-4">
      <!-- Formulaire de modification du profil -->
      <div class="col-md-6">
        <h2 class="mb-3">Mon profil</h2>
        @if (profileMsg()) { <div class="alert alert-success">{{ profileMsg() }}</div> }
        @if (profileErr()) { <div class="alert alert-danger">{{ profileErr() }}</div> }
        <form (ngSubmit)="saveProfile()">
          <div class="mb-3">
            <label class="form-label">Email (non modifiable)</label>
            <input class="form-control" [value]="email()" disabled />
          </div>
          <div class="mb-3">
            <label class="form-label">Nom</label>
            <input class="form-control" name="nom" [(ngModel)]="form.nom" />
          </div>
          <div class="mb-3">
            <label class="form-label">Prénom</label>
            <input class="form-control" name="prenom" [(ngModel)]="form.prenom" />
          </div>
          <div class="mb-3">
            <label class="form-label">Téléphone</label>
            <input class="form-control" name="telephone" [(ngModel)]="form.telephone" />
          </div>
          <button class="btn btn-primary">Enregistrer</button>
        </form>
      </div>

      <!-- Formulaire de changement du mot de passe -->
      <div class="col-md-6">
        <h2 class="mb-3">Mot de passe</h2>
        @if (pwdMsg()) { <div class="alert alert-success">{{ pwdMsg() }}</div> }
        @if (pwdErr()) { <div class="alert alert-danger">{{ pwdErr() }}</div> }
        <form (ngSubmit)="savePassword()">
          <div class="mb-3">
            <label class="form-label">Ancien mot de passe</label>
            <input class="form-control" type="password" name="ancien" [(ngModel)]="pwd.ancienPassword" />
          </div>
          <div class="mb-3">
            <label class="form-label">Nouveau mot de passe</label>
            <input class="form-control" type="password" name="nouveau" [(ngModel)]="pwd.nouveauPassword" />
          </div>
          <div class="mb-3">
            <label class="form-label">Confirmation</label>
            <input class="form-control" type="password" name="conf" [(ngModel)]="pwd.confirmation" />
          </div>
          <button class="btn btn-warning">Changer le mot de passe</button>
        </form>
      </div>
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  private auth = inject(AuthService);

  // Données du profil et du formulaire de mot de passe
  email = signal('');
  form = { nom: '', prenom: '', telephone: '' };
  pwd = { ancienPassword: '', nouveauPassword: '', confirmation: '' };

  // Messages de succès et d'erreur
  profileMsg = signal('');
  profileErr = signal('');
  pwdMsg = signal('');
  pwdErr = signal('');

  // Chargement des informations du profil
  ngOnInit() {
    this.auth.getProfile().subscribe((u) => {
      this.email.set(u.email);
      this.form = { nom: u.nom, prenom: u.prenom, telephone: u.telephone || '' };
    });
  }

  // Enregistrement des modifications du profil
  saveProfile() {
    this.profileMsg.set('');
    this.profileErr.set('');
    this.auth.updateProfile(this.form).subscribe({
      next: () => this.profileMsg.set('Profil mis à jour'),
      error: (err) => this.profileErr.set(err.error?.message || 'Erreur'),
    });
  }

  // Modification du mot de passe
  savePassword() {
    this.pwdMsg.set('');
    this.pwdErr.set('');
    this.auth.updatePassword(this.pwd).subscribe({
      next: (r) => {
        this.pwdMsg.set(r.message);
        this.pwd = { ancienPassword: '', nouveauPassword: '', confirmation: '' };
      },
      error: (err) => this.pwdErr.set(err.error?.message || 'Erreur'),
    });
  }
}