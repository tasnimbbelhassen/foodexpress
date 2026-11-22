const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const {
  createRestaurant,
  getRestaurants,
  getMyRestaurant,
  getRestaurantById,
  getRestaurantMenu,
  updateRestaurant,
} = require('../controllers/restaurantController');

router.get('/', getRestaurants); // public
router.get('/mine', auth, role('restaurateur', 'admin'), getMyRestaurant); // avant toute route /:id
router.post('/', auth, role('restaurateur', 'admin'), createRestaurant);

router.get('/:id/menu', getRestaurantMenu); // public : catégories + plats
router.get('/:id', getRestaurantById); // public
router.put('/:id', auth, role('restaurateur', 'admin'), updateRestaurant); // propriétaire uniquement

module.exports = router;
