
require('dotenv').config(); // Charge les variables d'environnement depuis le fichier .env

const express = require('express'); // Framework pour créer le serveur backend
const cors = require('cors'); // Autorise la communication entre le frontend et le backend
const connectDB = require('./config/database'); // Fonction de connexion à MongoDB

const app = express();

// Configuration des middlewares
app.use(cors({ origin: 'http://localhost:4200' })); // Autorise les requêtes provenant du frontend Angular
app.use(express.json()); // Permet de recevoir et traiter les données au format JSON

// Définition des routes de l'API
app.use('/api/auth', require('./routes/authRoutes')); // Inscription et connexion
app.use('/api/users', require('./routes/userRoutes')); // Gestion des utilisateurs
app.use('/api/restaurants', require('./routes/restaurantRoutes')); // Gestion des restaurants
app.use('/api/categories', require('./routes/categoryRoutes')); // Gestion des catégories
app.use('/api/dishes', require('./routes/dishRoutes')); // Gestion des plats
app.use('/api/panier', require('./routes/panierRoutes')); // Gestion du panier
app.use('/api/commandes', require('./routes/commandeRoutes')); // Gestion des commandes

// Route pour vérifier que le serveur fonctionne
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  // Erreur de validation des données Mongoose
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join(', ') });
  }

  // Erreur liée à un identifiant MongoDB invalide
  if (err.name === 'CastError') return res.status(400).json({ message: 'Identifiant invalide' });

  // Erreur de duplication d'une valeur unique (ex : email déjà utilisé)
  if (err.code === 11000) return res.status(409).json({ message: 'Cette valeur existe déjà' });

  // Affiche les autres erreurs dans la console
  if (!err.status) console.error(err);

  // Retourne le code HTTP et le message de l'erreur
  res.status(err.status || 500).json({ message: err.message || 'Erreur serveur' });
});

// Démarrage du serveur après la connexion à MongoDB
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Serveur sur http://localhost:${PORT}`));
});
