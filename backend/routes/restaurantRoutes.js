const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const {
  createRestaurant,
  getRestaurants,
  getMyRestaurant,
} = require('../controllers/restaurantController');

router.get('/', getRestaurants); // public
router.get('/mine', auth, role('restaurateur', 'admin'), getMyRestaurant); // avant toute route /:id
router.post('/', auth, role('restaurateur', 'admin'), createRestaurant);

module.exports = router;