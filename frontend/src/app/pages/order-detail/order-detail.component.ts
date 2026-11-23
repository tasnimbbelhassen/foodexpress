import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/icon/icon.component';
import {
  CommandeService,
  CommandeVue,
  ETAPES_SUIVI,
  STATUT_BADGES,
  STATUT_LABELS,
  StatutCommande,
  numeroCommande,
} from '../../core/services/commande.service';

// Intervalle d'actualisation automatique : 15 secondes
const INTERVALLE_ACTUALISATION_MS = 15000;

// Page PARTAGÉE entre le client et le restaurateur :
//  - client       : suivi du statut (tâche 2) + annulation si la commande est en attente
//  - restaurateur : détail de la commande (tâche 5) + accepter / refuser / marquer comme livrée
@Component({
  selector: 'app-order-detail',
  imports: [RouterLink, DatePipe, DecimalPipe, IconComponent],
  template: `
    <!-- Lien de retour : vers « Mes commandes » (client) ou « Commandes reçues » (restaurateur) -->
    <a [routerLink]="retour()" class="btn btn-link px-0 mb-2">
      <app-icon name="arrow-left" class="me-1" />Retour aux commandes
    </a>

    @if (loading()) {
      <p>Chargement...</p>
    } @else if (!commande()) {
      <div class="alert alert-danger">{{ error() || 'Commande introuvable.' }}</div>
    } @else if (commande(); as c) {
      <!-- Titre et statut actuel -->
      <div class="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <h2 class="mb-0">Commande {{ numero(c) }}</h2>
        <span class="badge fs-6" [class]="badge(c.statut)">{{ label(c.statut) }}</span>
      </div>

      <!-- ===== Suivi du statut ===== -->
      @if (c.statut === 'annulee') {
        @if (c.motifRefus) {
          <div class="alert alert-danger">
            <strong>Commande refusée par le restaurant.</strong><br />
            Motif : {{ c.motifRefus }}
          </div>
        } @else {
          <div class="alert alert-danger">Cette commande a été annulée.</div>
        }
      } @else {
        <!-- Barre d'étapes : en attente, acceptée, livrée.
             Les étapes déjà atteintes sont vertes et portent une coche. -->
           <p class="fw-semibold mb-2">Étapes de la commande</p>
        <div class="d-flex align-items-start mb-4" aria-label="Suivi de la commande">
          @for (e of etapes; track e; let i = $index) {
            <!-- Flèche entre deux étapes (verte quand l'étape suivante est atteinte) -->
            @if (i > 0) {
              <div class="fs-4 px-2" [class]="i <= indexEtape() ? 'text-success' : 'text-muted'">→</div>
            }
            <div class="text-center flex-fill">
              <div class="rounded-circle mx-auto d-flex align-items-center justify-content-center fw-bold"
                   style="width:38px;height:38px"
                   [class]="i <= indexEtape() ? 'bg-success text-white' : 'bg-light text-muted border'">
                @if (i <= indexEtape()) {
                  <app-icon name="check" [size]="20" />
                }
              </div>
              <div class="small text-muted mt-1">Étape {{ i + 1 }}</div>
              <div class="small" [class.fw-bold]="i === indexEtape()">{{ label(e) }}</div>
            </div>
          }
        </div>

        @if (c.statut === 'livre') {
          <div class="alert alert-success">
            <app-icon name="check-circle" class="me-1" />Commande livrée. Bon appétit !
          </div>
        } @else if (estClient) {
          <p class="text-muted small">
            Cette page se met à jour automatiquement.
            <button class="btn btn-sm btn-link p-0 align-baseline" (click)="actualiser()">
              <app-icon name="refresh" [size]="14" class="me-1" />Actualiser maintenant
            </button>
          </p>
        }
      }

      <!-- Message d'erreur éventuel (action impossible, etc.) -->
      @if (error()) { <div class="alert alert-danger">{{ error() }}</div> }

      <div class="row g-3">
        <!-- ===== Colonne gauche : plats et totaux ===== -->
        <div class="col-md-7">
          <div class="card">
            <div class="card-header fw-semibold">Plats commandés</div>
            <div class="table-responsive">
              <table class="table mb-0 align-middle">
                <thead>
                  <tr><th>Plat</th><th class="text-center">Qté</th><th class="text-end">Prix</th><th class="text-end">Sous-total</th></tr>
                </thead>
                <tbody>
                  @for (l of c.lignes; track l._id) {
                    <tr>
                      <td>{{ l.nomPlat }}</td>
                      <td class="text-center">{{ l.quantite }}</td>
                      <td class="text-end text-nowrap">{{ l.prixUnitaire | number: '1.2-2' }} DT</td>
                      <td class="text-end text-nowrap">{{ l.sousTotal | number: '1.2-2' }} DT</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <ul class="list-group list-group-flush">
              <li class="list-group-item d-flex justify-content-between"><span>Sous-total</span><span>{{ c.sousTotal | number: '1.2-2' }} DT</span></li>
              <li class="list-group-item d-flex justify-content-between"><span>Frais de livraison</span><span>{{ c.fraisLivraison | number: '1.2-2' }} DT</span></li>
              <li class="list-group-item d-flex justify-content-between fw-bold"><span>Total</span><span>{{ c.total | number: '1.2-2' }} DT</span></li>
            </ul>
          </div>
        </div>

        <!-- ===== Colonne droite : informations et boutons d'action ===== -->
        <div class="col-md-5">
          <div class="card">
            <div class="card-header fw-semibold">Informations</div>
            <ul class="list-group list-group-flush">
              <li class="list-group-item"><span class="text-muted">Date :</span> {{ c.dateCreation | date: 'dd/MM/yyyy HH:mm' }}</li>
              @if (estClient) {
                <!-- Le client voit le nom du restaurant -->
                <li class="list-group-item"><span class="text-muted">Restaurant :</span> {{ c.restaurant?.nom ?? 'Restaurant supprimé' }}</li>
              } @else {
                <!-- Le restaurateur voit le nom et le téléphone du client -->
                <li class="list-group-item">
                  <span class="text-muted">Client :</span>
                  {{ c.client ? c.client.prenom + ' ' + c.client.nom : 'Client supprimé' }}
                  @if (c.client?.telephone) { <br /><span class="text-muted">Tél :</span> {{ c.client?.telephone }} }
                </li>
              }
              <li class="list-group-item"><span class="text-muted">Livraison :</span> {{ c.adresseLivraison }}</li>
              <li class="list-group-item"><span class="text-muted">Paiement :</span> espèces à la livraison</li>
            </ul>
          </div>

          <!-- Formulaire du motif de refus (restaurateur) -->
          @if (!estClient && c.statut === 'en_attente' && refusOuvert()) {
            <div class="card mt-3">
              <div class="card-body">
                <label class="form-label fw-semibold" for="motif">Motif du refus (visible par le client)</label>
                <textarea id="motif" class="form-control mb-2" rows="2" maxlength="300"
                          placeholder="Ex. : plat indisponible, restaurant fermé..."
                          [value]="motif()" (input)="motif.set($any($event.target).value)"></textarea>
                <div class="d-flex gap-2">
                  <button class="btn btn-sm btn-danger" [disabled]="busy() || motif().trim().length < 3"
                          (click)="confirmerRefus()">Confirmer le refus</button>
                  <button class="btn btn-sm btn-outline-secondary" (click)="refusOuvert.set(false)">Annuler</button>
                </div>
              </div>
            </div>
          }

          <!-- Boutons d'action, selon le rôle et le statut -->
          <div class="d-flex flex-wrap gap-2 mt-3">
            @if (estClient && c.statut === 'en_attente') {
              <button class="btn btn-outline-danger" [disabled]="busy()" (click)="annuler()">Annuler la commande</button>
            }
            @if (!estClient && c.statut === 'en_attente') {
              <button class="btn btn-success" [disabled]="busy()" (click)="agir(service.accepter(c._id))">Accepter</button>
              <button class="btn btn-outline-danger" [disabled]="busy()" (click)="refusOuvert.set(true)">Refuser</button>
            }
            @if (!estClient && c.statut === 'acceptee') {
              <button class="btn btn-primary" [disabled]="busy()" (click)="agir(service.changerStatut(c._id, 'livre'))">
                Marquer comme livrée
              </button>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class OrderDetailComponent implements OnInit {
  service = inject(CommandeService); // public : utilisé directement dans le template
  private route = inject(ActivatedRoute); // pour lire l'identifiant dans l'URL
  private destroyRef = inject(DestroyRef); // pour arrêter le minuteur en quittant la page
  private auth = inject(AuthService);

  // true si l'utilisateur connecté est un client, false s'il est restaurateur
  estClient = this.auth.user()?.role === 'client';

  // Adresse du lien « Retour » selon le rôle
  retour = computed(() => (this.estClient ? '/orders' : '/restaurant-dashboard/orders'));

  commande = signal<CommandeVue | null>(null); // commande affichée
  loading = signal(true); // chargement initial
  busy = signal(false); // true pendant une action (désactive les boutons)
  error = signal(''); // message d'erreur
  refusOuvert = signal(false); // formulaire du motif de refus affiché ?
  motif = signal(''); // motif en cours de saisie

  // Étapes de la barre de suivi et position de l'étape actuelle (-1 si annulée)
  etapes = ETAPES_SUIVI;
  indexEtape = computed(() => {
    const c = this.commande();
    return c ? ETAPES_SUIVI.indexOf(c.statut) : -1;
  });

  // Fonctions utilisées dans le template
  numero = numeroCommande;
  label = (s: StatutCommande) => STATUT_LABELS[s];
  badge = (s: StatutCommande) => STATUT_BADGES[s];

  private id = ''; // identifiant de la commande (lu dans l'URL)

  ngOnInit() {
    // Lire l'identifiant dans l'URL : /orders/:id
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    this.charger();

    // Actualisation automatique toutes les 15 s, sauf si la commande est terminée
    const minuteur = setInterval(() => {
      const statut = this.commande()?.statut;
      if (statut === 'livre' || statut === 'annulee') return;
      if (!this.busy()) this.charger(true);
    }, INTERVALLE_ACTUALISATION_MS);
    // Arrêter le minuteur quand on quitte la page
    this.destroyRef.onDestroy(() => clearInterval(minuteur));
  }

  // Bouton « Actualiser maintenant »
  actualiser() {
    this.charger(true);
  }

  // Charge la commande depuis l'API.
  // silencieux = true : actualisation en arrière-plan, on garde l'écran actuel en cas d'erreur.
  private charger(silencieux = false) {
    this.service.detail(this.id).subscribe({
      next: (c) => {
        this.commande.set(c);
        this.loading.set(false);
        if (!silencieux) this.error.set('');
      },
      error: (err) => {
        if (!silencieux || !this.commande()) {
          this.error.set(err.error?.message || 'Impossible de charger la commande.');
        }
        this.loading.set(false);
      },
    });
  }

  // Exécute une action (accepter, refuser, annuler, livrer) et affiche la commande mise à jour
  agir(action: Observable<CommandeVue>) {
    this.error.set('');
    this.busy.set(true);
    action.subscribe({
      next: (c) => {
        this.commande.set(c);
        this.busy.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Action impossible.');
        this.busy.set(false);
        this.charger(true); // le statut a peut-être changé entre-temps
      },
    });
  }

  // Annulation par le client (avec confirmation)
  annuler() {
    if (confirm('Annuler cette commande ?')) this.agir(this.service.annuler(this.id));
  }

  // Refus par le restaurateur, avec le motif saisi
  confirmerRefus() {
    const motif = this.motif().trim();
    if (motif.length < 3) return;
    this.refusOuvert.set(false);
    this.agir(this.service.refuser(this.id, motif));
  }
}