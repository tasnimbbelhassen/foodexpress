
const mongoose = require('mongoose'); // Bibliothèque pour gérer MongoDB

// Définition du schéma Dish : structure et règles de validation d'un plat
const dishSchema = new mongoose.Schema(
  {
    nom: { type: String, required: [true, 'Le nom du plat est obligatoire'], trim: true }, // Nom du plat
    description: { type: String, trim: true, default: '' }, // Description du plat


    prix: {
      type: Number,
      required: [true, 'Le prix est obligatoire'],
      min: [0, 'Le prix ne peut pas être négatif'],
    },

    image: { type: String, default: '' }, // Image du plat


    disponible: { type: Boolean, default: true },


    categorie: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },

    // Référence vers le restaurant qui propose ce plat
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
  },
  { timestamps: true }
);

// Création et exportation du modèle Dish pour interagir avec la collection MongoDB
module.exports = mongoose.model('Dish', dishSchema);
