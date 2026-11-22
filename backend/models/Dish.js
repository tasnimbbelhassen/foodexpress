const mongoose = require('mongoose');

const dishSchema = new mongoose.Schema(
  {
    nom: { type: String, required: [true, 'Le nom du plat est obligatoire'], trim: true },
    description: { type: String, trim: true, default: '' },
    prix: {
      type: Number,
      required: [true, 'Le prix est obligatoire'],
      min: [0, 'Le prix ne peut pas être négatif'],
    },
    image: { type: String, default: '' },
    // Un plat indisponible ne peut pas être ajouté au panier (règle 3)
    disponible: { type: Boolean, default: true },
    categorie: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Dish', dishSchema);
