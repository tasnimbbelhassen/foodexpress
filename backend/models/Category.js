const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    nom: { type: String, required: [true, 'Le nom de la catégorie est obligatoire'], trim: true },
    description: { type: String, trim: true, default: '' },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
  },
  { timestamps: true }
);

// Deux catégories d'un même restaurant ne peuvent pas porter le même nom
categorySchema.index({ restaurant: 1, nom: 1 }, { unique: true, collation: { locale: 'fr', strength: 2 } });

module.exports = mongoose.model('Category', categorySchema);
