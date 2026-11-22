const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });

const publicUser = (user) => ({
  id: user._id,
  nom: user.nom,
  prenom: user.prenom,
  email: user.email,
  telephone: user.telephone,
  role: user.role,
});

exports.register = async (req, res) => {
  const { nom, prenom, email, telephone, password, confirmation, role } = req.body;

  if (!nom || !prenom || !email || !telephone || !password || !confirmation) {
    return res.status(400).json({ message: 'Tous les champs sont obligatoires' });
  }
  if (password !== confirmation) {
    return res.status(400).json({ message: 'La confirmation ne correspond pas au mot de passe' });
  }
  const strong = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
  if (!strong.test(password)) {
    return res.status(400).json({
      message: 'Le mot de passe doit contenir au moins 8 caractères, des lettres et des chiffres',
    });
  }
  if (await User.findOne({ email: email.toLowerCase() })) {
    return res.status(409).json({ message: 'Cet email est déjà utilisé' });
  }

  // Seuls "client" et "restaurateur" sont acceptés.
  // "admin" ou toute autre valeur devient "client".
  const allowedRole = role === 'restaurateur' ? 'restaurateur' : 'client';

  const user = await User.create({
    nom,
    prenom,
    email,
    telephone,
    password,
    role: allowedRole,
  });

  res.status(201).json({
    token: signToken(user),
    user: publicUser(user),
  });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe obligatoires' });
  }

  // password est en select:false, on le demande explicitement
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  // Même message dans les deux cas pour ne pas révéler si l'email existe
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
  }

  // Règle 10 : un compte désactivé ne peut plus se connecter
  if (!user.isActive) {
    return res.status(403).json({ message: 'Compte désactivé' });
  }

  res.json({
    token: signToken(user),
    user: publicUser(user),
  });
};

exports.signToken = signToken;