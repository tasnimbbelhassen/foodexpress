
const mongoose = require('mongoose'); // Bibliothèque pour gérer MongoDB avec des modèles
const bcrypt = require('bcryptjs'); // Bibliothèque pour sécuriser les mots de passe

// Définition du schéma User : structure et règles de validation d'un utilisateur
const userSchema = new mongoose.Schema(
  {
    // Informations personnelles
    nom: { type: String, required: [true, 'Le nom est obligatoire'], trim: true },
    prenom: { type: String, required: [true, 'Le prénom est obligatoire'], trim: true },
    email: {
      type: String,
      required: [true, "L'email est obligatoire"],
      unique: true, // Chaque utilisateur doit avoir un email unique
      lowercase: true, // Convertit l'email en minuscules
      trim: true, // Supprime les espaces au début et à la fin
      match: [/^\S+@\S+\.\S+$/, 'Email invalide'], // Vérifie le format de l'email
    },
    telephone: { type: String, required: [true, 'Le téléphone est obligatoire'], trim: true },

    // Mot de passe : obligatoire, minimum 8 caractères et non retourné par défaut dans les requêtes
    password: {
      type: String,
      required: [true, 'Le mot de passe est obligatoire'],
      minlength: [8, 'Le mot de passe doit contenir au moins 8 caractères'],
      select: false,
    },

    // Rôle de l'utilisateur : client, restaurateur ou administrateur
    role: {
      type: String,
      enum: ['client', 'restaurateur', 'admin'],
      default: 'client',
    },

    isActive: { type: Boolean, default: true }, // Indique si le compte est actif
  },
  { timestamps: true } // Ajoute automatiquement les dates de création et de modification
);

// Middleware exécuté avant chaque sauvegarde de l'utilisateur
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return; // Ne chiffre le mot de passe que s'il a été modifié
  this.password = await bcrypt.hash(this.password, 10); // Hash le mot de passe avec 10 salt rounds
});

// Méthode pour comparer un mot de passe saisi avec son hash enregistré
userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Création et exportation du modèle User pour interagir avec la collection MongoDB
module.exports = mongoose.model('User', userSchema);
