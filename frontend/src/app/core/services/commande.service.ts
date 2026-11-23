import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { API_URL } from '../api';

// ===========================================================================
// TYPES
// ===========================================================================

// Les 4 statuts possibles d'une commande (identiques à l'énumération du backend)
export type StatutCommande = 'en_attente' | 'acceptee' | 'livre' | 'annulee';

// Une ligne de commande : un plat, sa quantité et son prix au moment de la commande
export interface LigneCommande {
  _id: string;
  commande: string;
  plat: string;
  nomPlat: string;
  quantite: number;
  prixUnitaire: number;
  sousTotal: number;
}

// Commande telle que renvoyée à la création (utilisée par cart.service.ts)
export interface Commande {
  _id: string;
  client: string;
  restaurant: string;
  adresseLivraison: string;
  statut: StatutCommande;
  sousTotal: number;
  fraisLivraison: number;
  total: number;
  motifRefus?: string;
  dateCreation: string;
  lignes?: LigneCommande[];
}

// Commande renvoyée par /api/commandes/... :
// le client et le restaurant sont remplacés par leurs informations, et les lignes sont incluses.
export interface CommandeVue extends Omit<Commande, 'client' | 'restaurant' | 'lignes'> {
  client: { _id: string; nom: string; prenom: string; telephone?: string } | null;
  restaurant: { _id: string; nom: string; adresse?: string } | null;
  lignes: LigneCommande[];
}

// ===========================================================================
// CONSTANTES D'AFFICHAGE (partagées par toutes les pages de commandes)
// ===========================================================================

// Texte affiché pour chaque statut
export const STATUT_LABELS: Record<StatutCommande, string> = {
  en_attente: 'En attente',
  acceptee: 'Acceptée',
  livre: 'Livrée',
  annulee: 'Annulée',
};

// Classes Bootstrap (couleur du badge) pour chaque statut
export const STATUT_BADGES: Record<StatutCommande, string> = {
  en_attente: 'bg-warning text-dark',
  acceptee: 'bg-primary',
  livre: 'bg-success',
  annulee: 'bg-danger',
};

// Étapes de la barre de suivi. Une commande annulée sort de ce parcours.
export const ETAPES_SUIVI: StatutCommande[] = ['en_attente', 'acceptee', 'livre'];

// Numéro court affiché à l'écran : les 6 derniers caractères de l'identifiant, en majuscules
export const numeroCommande = (c: { _id: string }) => '#' + c._id.slice(-6).toUpperCase();

// ===========================================================================
// SERVICE : appels HTTP vers l'API /api/commandes
// ===========================================================================
@Injectable({ providedIn: 'root' })
export class CommandeService {
  private http = inject(HttpClient);

  // ----- Côté client -----

  // Historique des commandes du client connecté. Filtre optionnel par statut.
  mesCommandes(statut?: StatutCommande) {
    let params = new HttpParams();
    if (statut) params = params.set('statut', statut);
    return this.http.get<CommandeVue[]>(`${API_URL}/commandes/mes-commandes`, { params });
  }

  // Annuler une commande en attente
  annuler(id: string) {
    return this.http.patch<CommandeVue>(`${API_URL}/commandes/${id}/annuler`, {});
  }

  // ----- Côté restaurateur -----

  // Commandes reçues par mon restaurant. statut = 'en_attente' pour les nouvelles commandes.
  commandesRestaurant(statut?: StatutCommande) {
    let params = new HttpParams();
    if (statut) params = params.set('statut', statut);
    return this.http.get<CommandeVue[]>(`${API_URL}/commandes/restaurant`, { params });
  }

  // en_attente -> acceptee
  accepter(id: string) {
    return this.http.patch<CommandeVue>(`${API_URL}/commandes/${id}/accepter`, {});
  }

  // en_attente -> annulee
   refuser(id: string, motif: string) {
    return this.http.patch<CommandeVue>(`${API_URL}/commandes/${id}/refuser`, { motif });
  }

  // Changement de statut libre (ex. acceptee -> livre). Le backend refuse les transitions interdites.
  changerStatut(id: string, statut: StatutCommande) {
    return this.http.patch<CommandeVue>(`${API_URL}/commandes/${id}/statut`, { statut });
  }

  // ----- Client et restaurateur -----

  // Détail d'une commande (sert aussi au suivi du statut côté client)
  detail(id: string) {
    return this.http.get<CommandeVue>(`${API_URL}/commandes/${id}`);
  }
}