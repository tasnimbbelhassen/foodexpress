
const mongoose = require('mongoose'); // Bibliothèque pour gérer MongoDB

// Arrondit un nombre à deux chiffres après la virgule (ex : 12.567 → 12.57)
const round2 = (n) => Math.round(n * 100) / 100;

// Définition du schéma Panier : chaque client possède un seul panier associé à un restaurant
const panierSchema = new mongoose.Schema(
  {
    // Référence vers le client propriétaire du panier (un panier maximum par client)
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true }, // Restaurant concerné

    adresseLivraison: { type: String, trim: true, default: '' }, // Adresse de livraison

    sousTotal: { type: Number, default: 0, min: 0 }, // Somme des prix des articles
    fraisLivraison: { type: Number, default: 0, min: 0 }, // Frais de livraison
    total: { type: Number, default: 0, min: 0 }, // Montant total du panier
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true }, id: false }
);

// Le total du panier est calculé à partir du sous-total et des frais de livraison.

module.exports = mongoose.model('Panier', panierSchema); // Création et exportation du modèle Panier
