const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const {
  getDishes,
  getDishById,
  createDish,
  updateDish,
  setAvailability,
  deleteDish,
} = require('../controllers/dishController');

router.get('/', getDishes); // public : recherche et filtres
router.get('/:id', getDishById); // public

router.post('/', auth, role('restaurateur', 'admin'), createDish);
router.put('/:id', auth, role('restaurateur', 'admin'), updateDish);
router.patch('/:id/disponibilite', auth, role('restaurateur', 'admin'), setAvailability);
router.delete('/:id', auth, role('restaurateur', 'admin'), deleteDish);

module.exports = router;
