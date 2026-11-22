import { Injectable } from '@angular/core';

export type StatutCommande = 'en_attente' | 'acceptee' | 'livre' | 'annulee';

export interface LigneCommande {
  _id: string;
  commande: string;
  plat: string;
  nomPlat: string;
  quantite: number;
  prixUnitaire: number;
  sousTotal: number;
}

export interface Commande {
  _id: string;
  client: string;
  restaurant: string;
  adresseLivraison: string;
  statut: StatutCommande;
  sousTotal: number;
  fraisLivraison: number;
  total: number;
  dateCreation: string;
  lignes?: LigneCommande[];
}

// Personne 4 : ajoutera ici l'historique, le suivi du statut, accepter / refuser / annuler...
// (collections « commandes » et « lignecommandes » créées par la Personne 3 au moment de passerCommande)
@Injectable({ providedIn: 'root' })
export class CommandeService {}