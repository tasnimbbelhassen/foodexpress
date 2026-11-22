const Restaurant = require('../models/Restaurant');

// POST /api/restaurants (restaurateur ou admin)
exports.createRestaurant = async (req, res) => {
  const { nom, description, adresse, typeCuisine, image, fraisLivraison, horaires, isOpen } = req.body;

  if (!nom || !adresse || !typeCuisine) {
    return res.status(400).json({ message: 'Nom, adresse et type de cuisine sont obligatoires' });
  }

  // owner vient du token, jamais du body
  const restaurant = await Restaurant.create({
    nom,
    description,
    adresse,
    typeCuisine,
    image,
    fraisLivraison,
    horaires,
    isOpen,
    owner: req.user._id,
  });

  res.status(201).json(restaurant);
};