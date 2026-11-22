const mongoose = require('mongoose');

const round2 = (n) => Math.round(n * 100) / 100;

// Classe Commande, créée par Panier.passerCommande().
// Paiement unique : espèces à la livraison, donc aucun attribut « mode de paiement ».
const commandeSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    adresseLivraison: { type: String, required: [true, "L'adresse de livraison est obligatoire"], trim: true },
    statut: {
      type: String,
      enum: ['en_attente', 'acceptee', 'livre', 'annulee'], // énumération StatutCommande
      default: 'en_attente',
      index: true,
    },
    sousTotal: { type: Number, required: true, min: 0 },
    fraisLivraison: { type: Number, required: true, min: 0 },
        total: { type: Number, required: true, min: 0 },
    dateCreation: { type: Date, default: Date.now },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true }, id: false }
);



// +calculerTotal() : Double
commandeSchema.methods.calculerTotal = function () {
  return round2(this.sousTotal + this.fraisLivraison);
};

module.exports = mongoose.model('Commande', commandeSchema);