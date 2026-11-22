const mongoose = require('mongoose');

const round2 = (n) => Math.round(n * 100) / 100;

// Classe LignePanier : composition du Panier (Panier 1 --- 0..* LignePanier), référence un Plat.
const lignePanierSchema = new mongoose.Schema(
  {
    panier: { type: mongoose.Schema.Types.ObjectId, ref: 'Panier', required: true, index: true },
    plat: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish', required: true },
    quantite: {
      type: Number,
      required: true,
      min: [1, 'La quantité minimale est 1'],
      max: [99, 'Quantité maximale : 99'],
      validate: { validator: Number.isInteger, message: 'La quantité doit être un entier' },
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true }, id: false }
);

// Un même plat n'apparaît qu'une fois dans un panier
lignePanierSchema.index({ panier: 1, plat: 1 }, { unique: true });

// +sousTotal() : quantité x prix du plat (le plat doit être « populé »)
lignePanierSchema.virtual('sousTotal').get(function () {
  return this.plat && typeof this.plat.prix === 'number' ? round2(this.quantite * this.plat.prix) : 0;
});

module.exports = mongoose.model('LignePanier', lignePanierSchema);