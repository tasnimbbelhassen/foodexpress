
 // Middleware qui vérifie si l'utilisateur possède le rôle autorisé
module.exports = (...roles) => (req, res, next) => {

  // Vérifie que l'utilisateur est authentifié et que son rôle est autorisé
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Accès interdit pour ce rôle' }); // 403 : accès refusé
  }

  next(); // Autorise l'accès à la route si le rôle est valide
};
