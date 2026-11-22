const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentification requise' });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }

  const user = await User.findById(payload.id);
  if (!user) return res.status(401).json({ message: 'Utilisateur introuvable' });
  if (!user.isActive) return res.status(403).json({ message: 'Compte désactivé' });

  req.user = user;
  next();
};