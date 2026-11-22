const User = require('../models/User');

// GET /api/users/me
exports.getMe = async (req, res) => {
  const u = req.user;
  res.json({
    id: u._id,
    nom: u.nom,
    prenom: u.prenom,
    email: u.email,
    telephone: u.telephone,
    role: u.role,
  });
};

// PUT /api/users/me : seulement nom, prénom, téléphone
exports.updateMe = async (req, res) => {
  const { nom, prenom, telephone } = req.body;

  if (nom !== undefined && !nom.trim()) return res.status(400).json({ message: 'Nom invalide' });
  if (prenom !== undefined && !prenom.trim()) return res.status(400).json({ message: 'Prénom invalide' });
  if (telephone !== undefined && !telephone.trim()) return res.status(400).json({ message: 'Téléphone invalide' });

  // email et role sont volontairement ignorés
  if (nom !== undefined) req.user.nom = nom;
  if (prenom !== undefined) req.user.prenom = prenom;
  if (telephone !== undefined) req.user.telephone = telephone;

  await req.user.save();

  res.json({
    id: req.user._id,
    nom: req.user.nom,
    prenom: req.user.prenom,
    email: req.user.email,
    telephone: req.user.telephone,
    role: req.user.role,
  });
};

// PUT /api/users/me/password
exports.updatePassword = async (req, res) => {
  const { ancienPassword, nouveauPassword, confirmation } = req.body;

  if (!ancienPassword || !nouveauPassword || !confirmation) {
    return res.status(400).json({ message: 'Tous les champs sont obligatoires' });
  }
  if (nouveauPassword !== confirmation) {
    return res.status(400).json({ message: 'La confirmation ne correspond pas' });
  }
  const strong = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
  if (!strong.test(nouveauPassword)) {
    return res.status(400).json({
      message: 'Le mot de passe doit contenir au moins 8 caractères, des lettres et des chiffres',
    });
  }

  // req.user n'a pas le password (select:false), on le recharge
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(ancienPassword))) {
    return res.status(401).json({ message: 'Ancien mot de passe incorrect' });
  }

  user.password = nouveauPassword; // haché par le hook pre('save')
  await user.save();

  res.json({ message: 'Mot de passe modifié' });
};