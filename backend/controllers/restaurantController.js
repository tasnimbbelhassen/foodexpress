const Restaurant = require('../models/Restaurant');

// POST /api/restaurants (restaurateur ou admin)
exports.createRestaurant = async (req, res) => {
  const { nom, description, adresse, typeCuisine, image, fraisLivraison, horaires, isOpen } = req.body;

  if (!nom || !adresse || !typeCuisine) {
    return res.status(400).json({ message: 'Nom, adresse et type de cuisine sont obligatoires' });
  }

  // Un restaurateur ne peut avoir qu'un seul restaurant
  if (req.user.role === 'restaurateur') {
    const existing = await Restaurant.findOne({ owner: req.user._id });
    if (existing) {
      return res.status(409).json({ message: 'Vous avez déjà un restaurant' });
    }
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

// GET /api/restaurants/mine : le restaurant du restaurateur connecté (ou null)
exports.getMyRestaurant = async (req, res) => {
  const restaurant = await Restaurant.findOne({ owner: req.user._id });
  res.json(restaurant);
};

// GET /api/restaurants?search=pizza&cuisine=Italienne&open=true&sort=nom&page=1&limit=10
exports.getRestaurants = async (req, res) => {
  const { search, cuisine, open, sort } = req.query;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);

  const filter = { statut: 'valide' };

  if (search) {
    const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.nom = { $regex: escaped, $options: 'i' };
  }

  if (cuisine) {
    const escaped = cuisine.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.typeCuisine = { $regex: `^${escaped}$`, $options: 'i' };
  }

  if (open === 'true') filter.isOpen = true;

  const sortOption = sort === '-nom' ? { nom: -1 } : { nom: 1 };

  const [restaurants, total] = await Promise.all([
    Restaurant.find(filter)
      .sort(sortOption)
      .collation({ locale: 'fr', strength: 2 })
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