const Dish = require('../models/Dish');
const Category = require('../models/Category');
const Restaurant = require('../models/Restaurant');
const { HttpError, isId, getManagedRestaurant, assertCanManage } = require('../utils/ownership');

const escapeRegex = (s) => s.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parsePrix = (value) => {
  const prix = Number(value);
  if (value === '' || value === null || !Number.isFinite(prix) || prix < 0) {
    throw new HttpError(400, 'Le prix doit être un nombre positif ou nul');
  }
  return prix;
};

// La catégorie choisie doit appartenir au même restaurant que le plat
const assertCategoryInRestaurant = async (categorieId, restaurantId) => {
  if (!categorieId || !isId(categorieId)) throw new HttpError(400, 'La catégorie est obligatoire');
  const category = await Category.findById(categorieId);
  if (!category || !category.restaurant.equals(restaurantId)) {
    throw new HttpError(400, "Cette catégorie n'appartient pas à ce restaurant");
  }
};

// GET /api/dishes?restaurant=ID&categorie=ID&search=pizza&disponible=true&page=1&limit=20 (public)
exports.getDishes = async (req, res) => {
  const { restaurant, categorie, search, disponible } = req.query;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);

  const filter = {};

  // Seuls les plats de restaurants validés sont visibles publiquement
  if (restaurant) {
    if (!isId(restaurant)) throw new HttpError(400, 'Identifiant de restaurant invalide');
    const ok = await Restaurant.exists({ _id: restaurant, statut: 'valide' });
    if (!ok) return res.json({ data: [], page, limit, total: 0, totalPages: 0 });
    filter.restaurant = restaurant;
  } else {
    filter.restaurant = { $in: await Restaurant.find({ statut: 'valide' }).distinct('_id') };
  }

  if (categorie) {
    if (!isId(categorie)) throw new HttpError(400, 'Identifiant de catégorie invalide');
    filter.categorie = categorie;
  }
  if (search && search.trim()) filter.nom = { $regex: escapeRegex(search), $options: 'i' };
  if (disponible === 'true') filter.disponible = true;

  const [dishes, total] = await Promise.all([
    Dish.find(filter)
      .populate('restaurant', 'nom typeCuisine isOpen')
      .populate('categorie', 'nom')
      .sort({ nom: 1 })
      .collation({ locale: 'fr', strength: 2 })
      .skip((page - 1) * limit)
      .limit(limit),
    Dish.countDocuments(filter),
  ]);

  res.json({ data: dishes, page, limit, total, totalPages: Math.ceil(total / limit) });
};

// GET /api/dishes/:id (public)
exports.getDishById = async (req, res) => {
  if (!isId(req.params.id)) throw new HttpError(400, 'Identifiant invalide');
  const dish = await Dish.findById(req.params.id)
    .populate('restaurant', 'nom typeCuisine isOpen fraisLivraison statut')
    .populate('categorie', 'nom');
  if (!dish || dish.restaurant?.statut !== 'valide') throw new HttpError(404, 'Plat introuvable');
  res.json(dish);
};

// POST /api/dishes
exports.createDish = async (req, res) => {
  const { nom, description, prix, image, disponible, categorie } = req.body;
  if (!nom || !String(nom).trim()) throw new HttpError(400, 'Le nom du plat est obligatoire');
  const prixNum = parsePrix(prix);

  const restaurant = await getManagedRestaurant(req.user, req.body.restaurant);
  await assertCategoryInRestaurant(categorie, restaurant._id);

  const dish = await Dish.create({
    nom,
    description,
    prix: prixNum,
    image,
    disponible,
    categorie,
    restaurant: restaurant._id, // jamais lu depuis le body pour un restaurateur
  });
  res.status(201).json(dish);
};

// PUT /api/dishes/:id : modifie infos, prix, disponibilité, catégorie
exports.updateDish = async (req, res) => {
  if (!isId(req.params.id)) throw new HttpError(400, 'Identifiant invalide');
  const dish = await Dish.findById(req.params.id);
  if (!dish) throw new HttpError(404, 'Plat introuvable');
  await assertCanManage(req.user, dish.restaurant);

  const { nom, description, prix, image, disponible, categorie } = req.body;

  if (nom !== undefined) {
    if (!String(nom).trim()) throw new HttpError(400, 'Le nom du plat est obligatoire');
    dish.nom = nom;
  }
  if (description !== undefined) dish.description = description;
  if (prix !== undefined) dish.prix = parsePrix(prix);
  if (image !== undefined) dish.image = image;
  if (disponible !== undefined) dish.disponible = Boolean(disponible);
  if (categorie !== undefined) {
    await assertCategoryInRestaurant(categorie, dish.restaurant);
    dish.categorie = categorie;
  }

  await dish.save();
  res.json(dish);
};

// PATCH /api/dishes/:id/disponibilite : bascule (ou fixe) la disponibilité
exports.setAvailability = async (req, res) => {
  if (!isId(req.params.id)) throw new HttpError(400, 'Identifiant invalide');
  const dish = await Dish.findById(req.params.id);
  if (!dish) throw new HttpError(404, 'Plat introuvable');
  await assertCanManage(req.user, dish.restaurant);

  dish.disponible = typeof req.body.disponible === 'boolean' ? req.body.disponible : !dish.disponible;
  await dish.save();
  res.json(dish);
};

// DELETE /api/dishes/:id
// Les commandes passées gardent nom et prix du plat (snapshot), l'historique reste intact.
exports.deleteDish = async (req, res) => {
  if (!isId(req.params.id)) throw new HttpError(400, 'Identifiant invalide');
  const dish = await Dish.findById(req.params.id);
  if (!dish) throw new HttpError(404, 'Plat introuvable');
  await assertCanManage(req.user, dish.restaurant);

  await dish.deleteOne();
  res.json({ message: 'Plat supprimé' });
};
