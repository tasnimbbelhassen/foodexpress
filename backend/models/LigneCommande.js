
const mongoose = require('mongoose'); // Bibliothèque pour gérer MongoDB

// Arrondit un nombre à deux chiffres après la virgule
const round2 = (n) => Math.round(n * 100) / 100;

// Définition du schéma LigneCommande : représente un plat appartenant à une commande
// Le nom et le prix sont enregistrés comme un snapshot pour conserver l'historique de la commande
const ligneCommandeSchema = new mongoose.Schema(
  {
    commande: { type: mongoose.Schema.Types.ObjectId, ref: 'Commande', required: true, index: true }, // Commande associée
    plat: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish', required: true }, // Référence vers le plat original
    nomPlat: { type: String, required: true }, // Copie du nom du plat au moment de la commande


    quantite: {
      type: Number,
      required: true,
      min: [1, 'La quantité minimale est 1'],
      validate: { validator: Number.isInteger, message: 'La quantité doit être un entier' },
    },

    prixUnitaire: { type: Number, required: true, min: 0 }, // Copie du prix du plat au moment de la commande
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true }, id: false }
);

// Champ virtuel calculant le sous-total de la ligne : quantité × prix unitaire
ligneCommandeSchema.virtual('sousTotal').get(function () {
  return round2(this.quantite * this.prixUnitaire);
});

// Création et exportation du modèle LigneCommande
module.exports = mongoose.model('LigneCommande', ligneCommandeSchema);
