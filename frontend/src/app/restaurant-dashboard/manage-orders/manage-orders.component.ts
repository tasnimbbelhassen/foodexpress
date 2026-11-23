import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { IconComponent } from '../../shared/icon/icon.component';
import {
  CommandeService,
  CommandeVue,
  STATUT_BADGES,
  STATUT_LABELS,
  StatutCommande,
  numeroCommande,
} from '../../core/services/commande.service';
import { RestaurantService } from '../../core/services/restaurant.service';

// Intervalle d'actualisation automatique : 30 secondes
const INTERVALLE_ACTUALISATION_MS = 30000;

// Page RESTAURATEUR : commandes reçues par mon restaurant.
// Tâches 4 (nouvelles commandes), 6 (accepter), 7 (refuser) et 8 (modifier le statut).
@Component({
  selector: 'app-manage-orders',
  imports: [RouterLink, DatePipe, DecimalPipe, IconComponent],
  template: `
    <!-- Titre et bouton d'actualisation manuelle -->
    <div class="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
      <h2 class="mb-0">Commandes reçues</h2>
      <button class="btn btn-sm btn-outline-secondary" [disabled]="loading()" (click)="charger()">
        <app-icon name="refresh" class="me-1" />Actualiser
      </button>
    </div>

    @if (!restaurantChecked()) {
      <p>Chargement...</p>
    } @else if (!restaurants.myRestaurant()) {
      <!-- Le restaurateur n'a pas encore de restaurant -->
      <div class="alert alert-info">Créez d'abord votre restaurant pour recevoir des commandes.</div>
      <a class="btn btn-primary" routerLink="/create-restaurant">Créer mon restaurant</a>
    } @else {
      <!-- Onglets : un par statut -->
      <ul class="nav nav-tabs mb-3">
        @for (o of onglets; track o.valeur) {
          <li class="nav-item">
            <button class="nav-link" [class.active]="onglet() === o.valeur" (click)="choisir(o.valeur)">
              {{ o.label }}
            </button>
          </li>
        }
      </ul>

      @if (error()) { <div class="alert alert-danger">{{ error() }}</div> }

      @if (loading() && commandes().length === 0) {
        <p>Chargement...</p>
      } @else if (commandes().length === 0) {
        <div class="alert alert-info">Aucune commande dans cet onglet.</div>
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

            <!-- Corps : client, adresse, plats et total -->
            <div class="card-body">
              <p class="mb-1">
                Client : <strong>{{ c.client ? c.client.prenom + ' ' + c.client.nom : 'Client supprimé' }}</strong>
                @if (c.client?.telephone) { <span class="text-muted"> - {{ c.client?.telephone }}</span> }
              </p>
              <p class="mb-1 text-muted">Livraison : {{ c.adresseLivraison }}</p>
              <ul class="mb-2 ps-3">
                @for (l of c.lignes; track l._id) {
                  <li>{{ l.quantite }} x {{ l.nomPlat }}</li>
                }
              </ul>
              <p class="mb-0 fw-semibold">Total : {{ c.total | number: '1.2-2' }} DT</p>
            </div>

            <!-- Formulaire du motif de refus (s'ouvre après un clic sur « Refuser ») -->
            @if (refusId() === c._id) {
              <div class="card-body border-top bg-light">
                <label class="form-label fw-semibold" [for]="'motif-' + c._id">Motif du refus (visible par le client)</label>
                <textarea class="form-control mb-2" rows="2" maxlength="300" [id]="'motif-' + c._id"
                          placeholder="Ex. : plat indisponible, restaurant fermé..."
                          [value]="motif()" (input)="motif.set($any($event.target).value)"></textarea>
                <div class="d-flex gap-2">
                  <button class="btn btn-sm btn-danger" [disabled]="busyId() === c._id || motif().trim().length < 3"
                          (click)="confirmerRefus(c)">Confirmer le refus</button>
                  <button class="btn btn-sm btn-outline-secondary" (click)="fermerRefus()">Annuler</button>
                </div>
              </div>
            }

            <!-- Pied : boutons d'action selon le statut -->
            <div class="card-footer d-flex flex-wrap gap-2">
              <a class="btn btn-sm btn-outline-primary" [routerLink]="['/restaurant-dashboard/orders', c._id]">Détail</a>
              @if (c.statut === 'en_attente') {
                <button class="btn btn-sm btn-success" [disabled]="busyId() === c._id" (click)="agir(c, service.accepter(c._id))">Accepter</button>
                <button class="btn btn-sm btn-outline-danger" [disabled]="busyId() === c._id" (click)="ouvrirRefus(c)">Refuser</button>
              }
              @if (c.statut === 'acceptee') {
                <button class="btn btn-sm btn-primary" [disabled]="busyId() === c._id"
                        (click)="agir(c, service.changerStatut(c._id, 'livre'))">Marquer comme livrée</button>
              }
            </div>
          </div>
        }
      }
    }
  `,
})
export class ManageOrdersComponent implements OnInit {
  service = inject(CommandeService); // public : utilisé dans le template
  restaurants = inject(RestaurantService); // public : utilisé dans le template
  private destroyRef = inject(DestroyRef);

  commandes = signal<CommandeVue[]>([]); // commandes de l'onglet affiché
  loading = signal(false); // chargement en cours
  error = signal(''); // message d'erreur
  busyId = signal<string | null>(null); // commande en cours de traitement
  restaurantChecked = signal(false); // true quand on sait si le restaurateur a un restaurant
  onglet = signal<StatutCommande | ''>('en_attente'); // onglet « Nouvelles » par défaut
  refusId = signal<string | null>(null); // commande dont le formulaire de refus est ouvert
  motif = signal(''); // motif en cours de saisie

  // Onglets affichés ('' = toutes les commandes)
  onglets: { valeur: StatutCommande | ''; label: string }[] = [
    { valeur: 'en_attente', label: 'Nouvelles' },
    { valeur: 'acceptee', label: 'En cours' },
    { valeur: 'livre', label: 'Livrées' },
    { valeur: 'annulee', label: 'Annulées' },
    { valeur: '', label: 'Toutes' },
  ];

  // Fonctions utilisées dans le template
  numero = numeroCommande;
  label = (s: StatutCommande) => STATUT_LABELS[s];
  badge = (s: StatutCommande) => STATUT_BADGES[s];

  ngOnInit() {
    // 1) Vérifier que le restaurateur a un restaurant, puis charger ses commandes
    this.restaurants.getMine().subscribe({
      next: (r) => {
        this.restaurantChecked.set(true);
        if (r) this.charger();
      },
      error: () => {
        this.restaurantChecked.set(true);
        this.error.set('Impossible de charger votre restaurant.');
      },
    });

    // 2) Actualiser la liste toutes les 30 s pour voir arriver les nouvelles commandes
    const minuteur = setInterval(() => {
      if (this.restaurants.myRestaurant() && this.busyId() === null) this.charger(true);
    }, INTERVALLE_ACTUALISATION_MS);
    this.destroyRef.onDestroy(() => clearInterval(minuteur)); // arrêt en quittant la page
  }

  // Clic sur un onglet
  choisir(valeur: StatutCommande | '') {
    this.onglet.set(valeur);
    this.commandes.set([]);
    this.charger();
  }

  // Charge les commandes de l'onglet actuel.
  // silencieux = true : actualisation en arrière-plan (pas de message de chargement ni d'erreur).
  charger(silencieux = false) {
    const onglet = this.onglet();
    if (!silencieux) this.loading.set(true);
    this.service.commandesRestaurant(onglet || undefined).subscribe({
      next: (liste) => {
        if (onglet !== this.onglet()) return; // l'onglet a changé pendant le chargement : on ignore
        this.commandes.set(liste);
        this.loading.set(false);
        if (!silencieux) this.error.set('');
      },
      error: (err) => {
        this.loading.set(false);
        if (!silencieux) this.error.set(err.error?.message || 'Impossible de charger les commandes.');
      },
    });
  }

  // Exécute une action sur une commande, puis recharge la liste
  // (la commande change de statut, donc d'onglet).
  agir(c: CommandeVue, action: Observable<CommandeVue>) {
    this.error.set('');
    this.busyId.set(c._id); // désactive les boutons de cette commande
    action.subscribe({
      next: () => {
        this.busyId.set(null);
        this.charger(true);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Action impossible.');
        this.busyId.set(null);
        this.charger(true); // le statut a peut-être changé entre-temps
      },
    });
  }

  // Ouvre le formulaire de refus sous la commande
  ouvrirRefus(c: CommandeVue) {
    this.refusId.set(c._id);
    this.motif.set('');
  }

  fermerRefus() {
    this.refusId.set(null);
    this.motif.set('');
  }

  // Envoie le refus avec son motif
  confirmerRefus(c: CommandeVue) {
    const motif = this.motif().trim();
    if (motif.length < 3) return;
    this.agir(c, this.service.refuser(c._id, motif));
    this.fermerRefus();
  }
}