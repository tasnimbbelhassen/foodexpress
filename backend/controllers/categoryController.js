const Category = require('../models/Category');
const Dish = require('../models/Dish');
const { HttpError, isId, getManagedRestaurant, assertCanManage } = require('../utils/ownership');

const escapeRegex = (s) => s.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Nom déjà utilisé par une autre catégorie du même restaurant (casse ignorée) ?
const nameTaken = (restaurantId, nom, excludeId) =>
  Category.exists({
    restaurant: restaurantId,
    nom: { $regex: `^${escapeRegex(nom)}$`, $options: 'i' },
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  });

const DUPLICATE_MSG = 'Cette catégorie existe déjà dans votre restaurant';

// GET /api/categories?restaurant=ID (public)
exports.getCategories = async (req, res) => {
  const { restaurant } = req.query;
  if (!restaurant || !isId(restaurant)) {
    throw new HttpError(400, 'Le paramètre restaurant est obligatoire');
  }
  const categories = await Category.find({ restaurant })
    .sort({ nom: 1 })
    .collation({ locale: 'fr', strength: 2 });
  res.json(categories);
};

// POST /api/categories (restaurateur : son restaurant ; admin : body.restaurant)
exports.createCategory = async (req, res) => {
  const { nom, description } = req.body;
  if (!nom || !nom.trim()) throw new HttpError(400, 'Le nom de la catégorie est obligatoire');

  // Le restaurant vient du compte connecté, jamais du body (sauf admin)
  const restaurant = await getManagedRestaurant(req.user, req.body.restaurant);

  if (await nameTaken(restaurant._id, nom)) throw new HttpError(409, DUPLICATE_MSG);

  try {
    const category = await Category.create({ nom, description, restaurant: restaurant._id });
    res.status(201).json(category);
  } catch (err) {
    if (err.code === 11000) throw new HttpError(409, DUPLICATE_MSG); // filet : index unique
    throw err;
  }
};

// PUT /api/categories/:id
exports.updateCategory = async (req, res) => {
  if (!isId(req.params.id)) throw new HttpError(400, 'Identifiant invalide');
  const category = await Category.findById(req.params.id);
  if (!category) throw new HttpError(404, 'Catégorie introuvable');
  await assertCanManage(req.user, category.restaurant);

  const { nom, description } = req.body;
  if (nom !== undefined) {
    if (!String(nom).trim()) throw new HttpError(400, 'Le nom de la catégorie est obligatoire');
    if (await nameTaken(category.restaurant, nom, category._id)) throw new HttpError(409, DUPLICATE_MSG);
    category.nom = nom;
  }
  if (description !== undefined) category.description = description;

  try {
    await category.save();
  } catch (err) {
    if (err.code === 11000) throw new HttpError(409, DUPLICATE_MSG); // filet : index unique
    throw err;
  }
  res.json(category);
};

// DELETE /api/categories/:id
// Refusée si la catégorie contient encore des plats (évite des plats orphelins).
exports.deleteCategory = async (req, res) => {
  if (!isId(req.params.id)) throw new HttpError(400, 'Identifiant invalide');
  const category = await Category.findById(req.params.id);
  if (!category) throw new HttpError(404, 'Catégorie introuvable');
  await assertCanManage(req.user, category.restaurant);

  const count = await Dish.countDocuments({ categorie: category._id });
  if (count > 0) {
    throw new HttpError(
      409,
      `Impossible de supprimer : cette catégorie contient ${count} plat(s). Déplacez-les ou supprimez-les d'abord.`
    );
  }

  await category.deleteOne();
  res.json({ message: 'Catégorie supprimée' });
};
