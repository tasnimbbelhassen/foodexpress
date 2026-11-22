const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const { createRestaurant, getRestaurants } = require('../controllers/restaurantController');

router.get('/', getRestaurants); // public
router.post('/', auth, role('restaurateur', 'admin'), createRestaurant);

module.exports = router;