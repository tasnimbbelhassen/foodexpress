
const mongoose = require('mongoose'); // Bibliothèque pour gérer MongoDB

// Définition du schéma Category : structure et règles de validation d'une catégorie
const categorySchema = new mongoose.Schema(
  {
    nom: { type: String, required: [true, 'Le nom de la catégorie est obligatoire'], trim: true }, // Nom de la catégorie
    description: { type: String, trim: true, default: '' }, // Description de la catégorie

    // Référence vers le restaurant auquel appartient cette catégorie
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
  },
  { timestamps: true } // Ajoute automatiquement les dates de création et de modification
);

// Empêche la création de deux catégories portant le même nom dans un même restaurant
// La collation permet de ne pas distinguer les majuscules et les minuscules
categorySchema.index({ restaurant: 1, nom: 1 }, { unique: true, collation: { locale: 'fr', strength: 2 } });

// Création et exportation du modèle Category pour interagir avec MongoDB
module.exports = mongoose.model('Category', categorySchema);
