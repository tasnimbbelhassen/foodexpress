const mongoose = require('mongoose');

const round2 = (n) => Math.round(n * 100) / 100;

// Classe Panier : un seul panier par client (Utilisateur 1 --- 0..1 Panier) pour un seul restaurant.
const panierSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    adresseLivraison: { type: String, trim: true, default: '' },
    sousTotal: { type: Number, default: 0, min: 0 },
    fraisLivraison: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true }, id: false }
);

// -/total : dérivé (sousTotal + fraisLivraison)


module.exports = mongoose.model('Panier', panierSchema);