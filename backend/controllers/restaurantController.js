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

// GET /api/restaurants?search=pizza&cuisine=Italienne&open=true&sort=nom&page=1&limit=10
exports.getRestaurants = async (req, res) => {
  const { search, cuisine, open, sort } = req.query;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);

  // Seuls les restaurants validés sont visibles du public
  const filter = { statut: 'valide' };

  // Recherche par nom (insensible à la casse), caractères spéciaux échappés
  if (search) {
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.nom = { $regex: escaped, $options: 'i' };
  }

  // Filtre par type de cuisine
  if (cuisine) {
    const escaped = cuisine.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.typeCuisine = { $regex: `^${escaped}$`, $options: 'i' };
  }

  // Filtre "ouverts"
  if (open === 'true') filter.isOpen = true;

  // Tri alphabétique : sort=nom (A→Z) ou sort=-nom (Z→A). Par défaut A→Z.
  const sortOption = sort === '-nom' ? { nom: -1 } : { nom: 1 };

  const [restaurants, total] = await Promise.all([
    Restaurant.find(filter)
      .sort(sortOption)
      .collation({ locale: 'fr', strength: 2 }) // tri insensible à la casse et aux accents
      .skip((page - 1) * limit)
      .limit(limit),
    Restaurant.countDocuments(filter),
  ]);

  res.json({
    data: restaurants,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
};