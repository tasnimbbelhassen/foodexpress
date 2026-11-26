import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { CartService, MAX_QUANTITE } from '../../core/services/cart.service';
import { Commande } from '../../core/services/commande.service';

@Component({
  selector: 'app-cart',
  imports: [FormsModule, RouterLink, DecimalPipe],
  template: `
    <h2 class="mb-3">🛒 Mon panier</h2>

    @if (confirmed(); as commande) {
      <!-- Confirmation de la commande -->
      <div class="alert alert-success">
        <h5 class="alert-heading">Commande envoyée ✅</h5>
        <p class="mb-1">
          Votre commande de <strong>{{ commande.total | number: '1.2-2' }} DT</strong> a bien été enregistrée
          (statut : en attente).
        </p>
        <p class="mb-0">Livraison à : {{ commande.adresseLivraison }} · Paiement en espèces à la livraison.</p>
      </div>
      <a [routerLink]="['/orders', commande._id]" class="btn btn-success me-2">Suivre ma commande</a>
      <a routerLink="/restaurants" class="btn btn-primary">Continuer mes achats</a>
    } @else if (loading()) {
      <p>Chargement...</p>
    } @else if (cart.isEmpty()) {
      <!-- Affichage si le panier est vide -->
      <div class="alert alert-info">Votre panier est vide.</div>
      <a routerLink="/restaurants" class="btn btn-primary">Voir les restaurants</a>
    } @else if (cart.panier(); as p) {
      <!-- Informations sur le restaurant -->
      @if (p.restaurant) {
        <p class="text-muted">
          Restaurant : <a [routerLink]="['/restaurants', p.restaurant._id]">{{ p.restaurant.nom }}</a>
          @if (!p.restaurant.isOpen) { <span class="badge bg-secondary ms-2">Fermé</span> }
        </p>
      }

      <!-- Liste des plats du panier -->
      <div class="table-responsive">
        <table class="table align-middle">
          <thead>
            <tr>
              <th>Plat</th>
              <th class="text-end">Prix</th>
              <th class="text-center" style="width:160px">Quantité</th>
              <th class="text-end">Sous-total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (l of p.lignes; track l._id) {
              <tr>
                <td>
                  {{ l.plat.nom }}
                  @if (!l.plat.disponible) { <span class="badge bg-secondary ms-1">Indisponible</span> }
                </td>
                <td class="text-end text-nowrap">{{ l.plat.prix | number: '1.2-2' }} DT</td>
                <td class="text-center">
                  <!-- Boutons de modification de la quantité -->
                  <div class="btn-group btn-group-sm" role="group">
                    <button class="btn btn-outline-secondary" [disabled]="busy() || l.quantite <= 1"
                            (click)="changer(l._id, -1)" aria-label="Diminuer">−</button>
                    <span class="btn btn-light disabled px-3">{{ l.quantite }}</span>
                    <button class="btn btn-outline-secondary" [disabled]="busy() || l.quantite >= max"
                            (click)="changer(l._id, 1)" aria-label="Augmenter">+</button>
                  </div>
                </td>
                <td class="text-end text-nowrap">{{ l.sousTotal | number: '1.2-2' }} DT</td>
                <td class="text-end">
                  <button class="btn btn-sm btn-outline-danger" [disabled]="busy()" (click)="supprimer(l._id)">Supprimer</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Adresse de livraison et récapitulatif des prix -->
      <div class="row g-4">
        <div class="col-md-7">
          <label class="form-label fw-semibold" for="adresse">Adresse de livraison *</label>
          <textarea id="adresse" class="form-control" rows="2" maxlength="300"
                    placeholder="Rue, numéro, ville..."
                    [ngModel]="adresse()" (ngModelChange)="adresse.set($event)"
                    (blur)="enregistrerAdresse()"></textarea>
          <div class="form-text">Paiement unique : espèces (cash) à la livraison.</div>
        </div>

        <div class="col-md-5">
          <ul class="list-group">
            <li class="list-group-item d-flex justify-content-between">
              <span>Sous-total</span><span>{{ p.sousTotal | number: '1.2-2' }} DT</span>
            </li>
            <li class="list-group-item d-flex justify-content-between">
              <span>Frais de livraison</span><span>{{ p.fraisLivraison | number: '1.2-2' }} DT</span>
            </li>
            <li class="list-group-item d-flex justify-content-between fw-bold">
              <span>Total</span><span>{{ p.total | number: '1.2-2' }} DT</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Messages d'erreur et actions du panier -->
      @if (error()) {
        <div class="alert alert-danger mt-3">{{ error() }}</div>
      }

      <div class="d-flex gap-2 mt-3">
        <button class="btn btn-success" [disabled]="busy()" (click)="passerCommande()">
          {{ busy() ? 'Veuillez patienter...' : 'Passer la commande' }}
        </button>
        <button class="btn btn-outline-secondary" [disabled]="busy()" (click)="vider()">Vider le panier</button>
      </div>
    }
  `,
})
export class CartComponent implements OnInit {
  cart = inject(CartService);

  // État du panier et de la commande
  max = MAX_QUANTITE;
  adresse = signal('');
  loading = signal(true);
  busy = signal(false);
  error = signal('');
  confirmed = signal<Commande | null>(null);

  // Chargement initial du panier
  ngOnInit() {
    this.cart.charger().subscribe({
      next: (p) => {
        this.adresse.set(p.adresseLivraison || '');
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger le panier.');
        this.loading.set(false);
      },
    });
  }

  // Exécute une action sur le panier en gérant « occupé » et les erreurs
  private run(action: Observable<unknown>, after?: () => void) {
    this.error.set('');
    this.busy.set(true);
    action.subscribe({
      next: () => {
        this.busy.set(false);
        after?.();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Une erreur est survenue. Réessayez.');
        this.busy.set(false);
      },
    });
  }

  // Modifier la quantité d'un plat
  changer(ligneId: string, delta: 1 | -1) {
    this.run(this.cart.modifierQuantite(ligneId, delta));
  }

  // Supprimer un plat du panier
  supprimer(ligneId: string) {
    this.run(this.cart.supprimerPlat(ligneId));
  }

  // Vider complètement le panier
  vider() {
    if (confirm('Vider tout le panier ?')) this.run(this.cart.viderPanier());
  }

  // Sauvegarde l'adresse dans le panier quand on quitte le champ
  enregistrerAdresse() {
    const a = this.adresse().trim();
    if (a && a !== this.cart.panier()?.adresseLivraison) {
      this.cart.saisirAdresse(a).subscribe({ error: () => {} });
    }
  }

  // Validation et envoi de la commande
  passerCommande() {
    const adresse = this.adresse().trim();
    if (!adresse) {
      this.error.set("L'adresse de livraison est obligatoire.");
      return;
    }
    this.error.set('');
    this.busy.set(true);
    this.cart.passerCommande(adresse).subscribe({
      next: (commande) => {
        this.confirmed.set(commande);
        this.busy.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Impossible de passer la commande. Réessayez.');
        this.busy.set(false);
      },
    });
  }
}