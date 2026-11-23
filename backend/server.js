require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

const app = express();

app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/restaurants', require('./routes/restaurantRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/dishes', require('./routes/dishRoutes'));
app.use('/api/panier', require('./routes/panierRoutes'));
app.use('/api/commandes', require('./routes/commandeRoutes'));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Gestion d'erreurs globale
app.use((err, req, res, next) => {
  // Erreurs Mongoose : renvoyées en 4xx plutôt qu'en 500
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join(', ') });
  }
  if (err.name === 'CastError') return res.status(400).json({ message: 'Identifiant invalide' });
  if (err.code === 11000) return res.status(409).json({ message: 'Cette valeur existe déjà' });

  if (!err.status) console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Erreur serveur' });
});

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Serveur sur http://localhost:${PORT}`));
});