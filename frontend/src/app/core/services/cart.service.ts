import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { API_URL } from '../api';
import { AuthService } from './auth.service';
import { Commande } from './commande.service';

export const MAX_QUANTITE = 99;

// LignePanier renvoyée par l'API (avec le plat)
export interface LignePanier {
  _id: string;
  plat: { _id: string; nom: string; prix: number; image: string; disponible: boolean };
  quantite: number;
  sousTotal: number;
}

// Panier renvoyé par l'API (collections « paniers » et « lignepaniers » dans MongoDB)
export interface Panier {
  _id: string | null;
  restaurant: { _id: string; nom: string; fraisLivraison: number; isOpen: boolean } | null;
  adresseLivraison: string;
  sousTotal: number;
  fraisLivraison: number;
  total: number;
  lignes: LignePanier[];
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  private _panier = signal<Panier | null>(null);
  panier = this._panier.asReadonly();

  lignes = computed(() => this._panier()?.lignes ?? []);
  isEmpty = computed(() => this.lignes().length === 0);
  // Nombre total d'articles (pastille de la barre de navigation)
  count = computed(() => this.lignes().reduce((n, l) => n + l.quantite, 0));

  constructor() {
    // Charge le panier du client à la connexion, le vide à la déconnexion
    effect(() => {
      const user = this.auth.user();
      if (user?.role === 'client') {
        this.charger().subscribe({ error: () => this._panier.set(null) });
      } else {
        this._panier.set(null);
      }
    });
  }

  quantiteOf(platId: string): number {
    return this.lignes().find((l) => l.plat._id === platId)?.quantite ?? 0;
  }

  // Consulter le panier
  charger() {
    return this.http.get<Panier>(`${API_URL}/panier`).pipe(tap((p) => this._panier.set(p)));
  }

  // remplacer = true : vide l'ancien panier si le plat vient d'un autre restaurant
  ajouterPlat(platId: string, remplacer = false) {
    return this.http
      .post<Panier>(`${API_URL}/panier/plats`, { plat: platId, remplacer })
      .pipe(tap((p) => this._panier.set(p)));
  }

  // delta = +1 ou -1
  modifierQuantite(ligneId: string, delta: 1 | -1) {
    return this.http
      .patch<Panier>(`${API_URL}/panier/plats/${ligneId}`, { delta })
      .pipe(tap((p) => this._panier.set(p)));
  }

  supprimerPlat(ligneId: string) {
    return this.http.delete<Panier>(`${API_URL}/panier/plats/${ligneId}`).pipe(tap((p) => this._panier.set(p)));
  }

  saisirAdresse(adresseLivraison: string) {
    return this.http
      .put<Panier>(`${API_URL}/panier/adresse`, { adresseLivraison })
      .pipe(tap((p) => this._panier.set(p)));
  }

  viderPanier() {
    return this.http.delete<Panier>(`${API_URL}/panier`).pipe(tap((p) => this._panier.set(p)));
  }

  // Crée la Commande (et ses LigneCommande) puis vide le panier
  passerCommande(adresseLivraison: string) {
    return this.http
      .post<Commande>(`${API_URL}/panier/commander`, { adresseLivraison })
      .pipe(tap(() => this.charger().subscribe({ error: () => this._panier.set(null) })));
  }
}