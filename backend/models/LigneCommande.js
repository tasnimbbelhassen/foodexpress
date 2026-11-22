const mongoose = require('mongoose');

const round2 = (n) => Math.round(n * 100) / 100;

// Classe LigneCommande : composition de la Commande (Commande 1 --- 0..* LigneCommande).
// Copie (snapshot) du nom et du prix du plat : l'historique ne change pas si le plat est modifié ou supprimé.
const ligneCommandeSchema = new mongoose.Schema(
  {
    commande: { type: mongoose.Schema.Types.ObjectId, ref: 'Commande', required: true, index: true },
    plat: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish', required: true },
    nomPlat: { type: String, required: true },
    quantite: {
      type: Number,
      required: true,
      min: [1, 'La quantité minimale est 1'],
      validate: { validator: Number.isInteger, message: 'La quantité doit être un entier' },
    },
    prixUnitaire: { type: Number, required: true, min: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true }, id: false }
);

// +sousTotal() : Double
ligneCommandeSchema.virtual('sousTotal').get(function () {
  return round2(this.quantite * this.prixUnitaire);
});

module.exports = mongoose.model('LigneCommande', ligneCommandeSchema);