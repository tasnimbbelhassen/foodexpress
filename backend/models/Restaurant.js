
const mongoose = require('mongoose'); // Bibliothèque pour gérer MongoDB avec des schémas et des modèles

// Définition du schéma Restaurant : structure et règles de validation d'un restaurant
const restaurantSchema = new mongoose.Schema(
  {
    nom: { type: String, required: [true, 'Le nom est obligatoire'], trim: true }, // Nom du restaurant
    description: { type: String, trim: true, default: '' }, // Description du restaurant
    adresse: { type: String, required: [true, "L'adresse est obligatoire"], trim: true }, // Adresse du restaurant
    typeCuisine: { type: String, required: [true, 'Le type de cuisine est obligatoire'], trim: true }, // Spécialité culinaire
    image: { type: String, default: '' }, // Image du restaurant
    fraisLivraison: { type: Number, min: [0, 'Les frais ne peuvent pas être négatifs'], default: 0 }, // Frais de livraison
    horaires: { type: String, trim: true, default: '' }, // Horaires d'ouverture
    isOpen: { type: Boolean, default: true }, // Indique si le restaurant est ouvert

    // Référence vers l'utilisateur propriétaire du restaurant
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // Statut de validation du restaurant par l'administrateur
    statut: { type: String, enum: ['en_attente', 'valide', 'suspendu'], default: 'valide' },
  },
  { timestamps: true } // Ajoute automatiquement les dates de création et de modification
);

// Création et exportation du modèle Restaurant pour accéder à la collection MongoDB
module.exports = mongoose.model('Restaurant', restaurantSchema);
