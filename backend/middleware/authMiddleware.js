const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Vérifie le token JWT et identifie l'utilisateur connecté.
module.exports = async (req, res, next) => {
  // Récupère le token depuis l'en-tête Authorization.
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  // Refuse l'accès si aucun token n'est fourni.
  if (!token) {
    return res.status(401).json({ message: 'Authentification requise' });
  }

  let payload;
  try {
    // Vérifie la validité du token et récupère son contenu.
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }

  // Recherche l'utilisateur correspondant à l'identifiant du token.
  const user = await User.findById(payload.id);
  if (!user) return res.status(401).json({ message: 'Utilisateur introuvable' });

  // Bloque l'accès si le compte est désactivé.
  if (!user.isActive) return res.status(403).json({ message: 'Compte désactivé' });

  // Rend les informations de l'utilisateur accessibles aux routes suivantes.
  req.user = user;
  next();
};