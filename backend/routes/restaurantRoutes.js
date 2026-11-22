const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const { createRestaurant } = require('../controllers/restaurantController');

router.post('/', auth, role('restaurateur', 'admin'), createRestaurant);

module.exports = router;