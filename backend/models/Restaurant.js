const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema(
  {
    nom: { type: String, required: [true, 'Le nom est obligatoire'], trim: true },
    description: { type: String, trim: true, default: '' },
    adresse: { type: String, required: [true, "L'adresse est obligatoire"], trim: true },
    typeCuisine: { type: String, required: [true, 'Le type de cuisine est obligatoire'], trim: true },
    image: { type: String, default: '' },
    fraisLivraison: { type: Number, min: [0, 'Les frais ne peuvent pas être négatifs'], default: 0 },
    horaires: { type: String, trim: true, default: '' },
    isOpen: { type: Boolean, default: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Validation par l'admin (module 7). "valide" par défaut pour ne pas bloquer les tests.
    statut: { type: String, enum: ['en_attente', 'valide', 'suspendu'], default: 'valide' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Restaurant', restaurantSchema);
