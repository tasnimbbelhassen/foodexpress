import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/icon/icon.component';
import {
  CommandeService,
  CommandeVue,
  STATUT_BADGES,
  STATUT_LABELS,
  StatutCommande,
  numeroCommande,
} from '../../core/services/commande.service';

// Page CLIENT : historique de mes commandes (tâche 1)
// + annulation d'une commande en attente (tâche 3).
@Component({
  selector: 'app-orders',
  imports: [RouterLink, DatePipe, DecimalPipe, IconComponent],
  template: `
    <h2 class="mb-3"><app-icon name="package" [size]="26" class="me-2" />Mes commandes</h2>

    <!-- Boutons de filtre par statut -->
    <div class="btn-group mb-3 flex-wrap" role="group" aria-label="Filtrer par statut">
      @for (f of filtres; track f.valeur) {
        <button type="button" class="btn btn-sm"
                [class.btn-primary]="filtre() === f.valeur" [class.btn-outline-primary]="filtre() !== f.valeur"
                (click)="choisir(f.valeur)">
          {{ f.label }}
        </button>
      }
    </div>

    <!-- Message d'erreur éventuel -->
    @if (error()) { <div class="alert alert-danger">{{ error() }}</div> }

    @if (loading()) {
      <p>Chargement...</p>
    } @else if (commandes().length === 0) {
      <!-- Aucune commande (avec ou sans filtre) -->
      <div class="alert alert-info">
        {{ filtre() ? 'Aucune commande avec ce statut.' : "Vous n'avez pas encore passé de commande." }}
      </div>
      <a routerLink="/restaurants" class="btn btn-primary">Voir les restaurants</a>
    } @else {
      <!-- Une carte par commande -->
      @for (c of commandes(); track c._id) {
        <div class="card mb-3">
          <!-- En-tête : numéro, date et statut -->
          <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div>
              <strong>{{ numero(c) }}</strong>
              <span class="text-muted ms-2">{{ c.dateCreation | date: 'dd/MM/yyyy HH:mm' }}</span>
            </div>
            <span class="badge" [class]="badge(c.statut)">{{ label(c.statut) }}</span>
          </div>

          <!-- Corps : restaurant, plats et total -->
          <div class="card-body">
            <p class="mb-1">
              Restaurant : <strong>{{ c.restaurant?.nom ?? 'Restaurant supprimé' }}</strong>
            </p>
            <ul class="mb-2 ps-3">
              @for (l of c.lignes; track l._id) {
                <li>{{ l.quantite }} x {{ l.nomPlat }}</li>
              }
            </ul>
            <p class="mb-0 fw-semibold">
              Total : {{ c.total | number: '1.2-2' }} DT
              <span class="text-muted fw-normal">(espèces à la livraison)</span>
            </p>
                        @if (c.statut === 'annulee' && c.motifRefus) {
              <div class="alert alert-danger py-2 mt-2 mb-0">
                <strong>Refusée par le restaurant.</strong> Motif : {{ c.motifRefus }}
              </div>
            }
          </div>

          <!-- Pied : lien vers le suivi, et bouton d'annulation si la commande est en attente -->
          <div class="card-footer d-flex gap-2">
            <a class="btn btn-sm btn-outline-primary" [routerLink]="['/orders', c._id]">Suivre / voir le détail</a>
            @if (c.statut === 'en_attente') {
              <button class="btn btn-sm btn-outline-danger" [disabled]="busyId() === c._id" (click)="annuler(c)">
                Annuler la commande
              </button>
            }
          </div>
        </div>
      }
    }
  `,
})
export class OrdersComponent implements OnInit {
  private service = inject(CommandeService);

  // « signal » = variable réactive : l'écran se met à jour tout seul quand sa valeur change
  commandes = signal<CommandeVue[]>([]); // commandes affichées
  loading = signal(true); // true pendant le chargement
  error = signal(''); // message d'erreur
  busyId = signal<string | null>(null); // identifiant de la commande en cours d'annulation
  filtre = signal<StatutCommande | ''>(''); // statut choisi ('' = toutes)

  // Boutons de filtre affichés en haut de la page
  filtres: { valeur: StatutCommande | ''; label: string }[] = [
    { valeur: '', label: 'Toutes' },
    { valeur: 'en_attente', label: 'En attente' },
    { valeur: 'acceptee', label: 'Acceptées' },
    { valeur: 'livre', label: 'Livrées' },
    { valeur: 'annulee', label: 'Annulées' },
  ];

  // Fonctions utilisées dans le template
  numero = numeroCommande;
  label = (s: StatutCommande) => STATUT_LABELS[s];
  badge = (s: StatutCommande) => STATUT_BADGES[s];

  // Au chargement de la page : récupérer l'historique
  ngOnInit() {
    this.charger();
  }

  // Clic sur un bouton de filtre
  choisir(valeur: StatutCommande | '') {
    this.filtre.set(valeur);
    this.charger();
  }

  // Appelle l'API et remplit la liste des commandes
  private charger() {
    this.loading.set(true);
    this.error.set('');
    this.service.mesCommandes(this.filtre() || undefined).subscribe({
      next: (liste) => {
        this.commandes.set(liste);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || "Impossible de charger l'historique.");
        this.loading.set(false);
      },
    });
  }

  // Annule une commande en attente (après confirmation)
  annuler(c: CommandeVue) {
    if (!confirm(`Annuler la commande ${this.numero(c)} ?`)) return;
    this.error.set('');
    this.busyId.set(c._id); // désactive le bouton pendant la requête
    this.service.annuler(c._id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.charger(); // recharge la liste : la commande change de statut
      },
      error: (err) => {
        this.error.set(err.error?.message || "Impossible d'annuler la commande.");
        this.busyId.set(null);
        this.charger(); // le statut a peut-être changé entre-temps
      },
    });
  }
}