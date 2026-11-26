
const mongoose = require('mongoose'); // Bibliothèque pour gérer MongoDB

// Arrondit un nombre à deux chiffres après la virgule
const round2 = (n) => Math.round(n * 100) / 100;

// Définition du schéma LignePanier : représente un plat ajouté au panier avec sa quantité
const lignePanierSchema = new mongoose.Schema(
  {
    // Référence vers le panier auquel appartient cette ligne
    panier: { type: mongoose.Schema.Types.ObjectId, ref: 'Panier', required: true, index: true },

    // Référence vers le plat ajouté au panier
    plat: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish', required: true },


    quantite: {
      type: Number,
      required: true,
      min: [1, 'La quantité minimale est 1'], // Quantité minimale : 1
      max: [99, 'Quantité maximale : 99'], // Quantité maximale : 99
      validate: { validator: Number.isInteger, message: 'La quantité doit être un entier' }, // Accepte uniquement les nombres entiers
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true }, id: false }
);

// Garantit qu'un même plat ne peut apparaître qu'une seule fois dans un même panier
lignePanierSchema.index({ panier: 1, plat: 1 }, { unique: true });

// Champ virtuel calculant automatiquement le sous-total : quantité × prix du plat
// Le plat doit être populé pour accéder à son prix
lignePanierSchema.virtual('sousTotal').get(function () {
  return this.plat && typeof this.plat.prix === 'number' ? round2(this.quantite * this.plat.prix) : 0;
});

// Création et exportation du modèle LignePanier
module.exports = mongoose.model('LignePanier', lignePanierSchema);
