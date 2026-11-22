const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');

// Erreur HTTP lisible par le gestionnaire d'erreurs global (server.js)
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const isId = (id) => mongoose.isValidObjectId(id);

// Retourne le restaurant sur lequel l'utilisateur a le droit d'agir.
// - restaurateur : uniquement SON restaurant (règle : propriétaire uniquement)
// - admin : n'importe quel restaurant, désigné par `restaurantId`
exports.getManagedRestaurant = async (user, restaurantId) => {
  if (user.role === 'admin') {
    if (!restaurantId || !isId(restaurantId)) {
      throw new HttpError(400, 'Le restaurant est obligatoire (identifiant invalide)');
    }
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) throw new HttpError(404, 'Restaurant introuvable');
    return restaurant;
  }

  const restaurant = await Restaurant.findOne({ owner: user._id });
  if (!restaurant) {
    throw new HttpError(403, "Vous devez d'abord créer votre restaurant");
  }
  return restaurant;
};

// Vérifie qu'une ressource (catégorie, plat) appartient bien à un restaurant géré par l'utilisateur.
// Retourne le restaurant. Pour un restaurateur : 403 si la ressource est celle d'un autre.
exports.assertCanManage = async (user, resourceRestaurantId) => {
  const restaurant = await Restaurant.findById(resourceRestaurantId);
  if (!restaurant) throw new HttpError(404, 'Restaurant introuvable');
  if (user.role !== 'admin' && !restaurant.owner.equals(user._id)) {
    throw new HttpError(403, "Ce restaurant ne vous appartient pas");
  }
  return restaurant;
};

exports.HttpError = HttpError;
exports.isId = isId;
