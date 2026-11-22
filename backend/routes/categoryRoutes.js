const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');

router.get('/', getCategories); // public : ?restaurant=ID

// Gestion réservée au restaurateur (son restaurant) et à l'admin
router.post('/', auth, role('restaurateur', 'admin'), createCategory);
router.put('/:id', auth, role('restaurateur', 'admin'), updateCategory);
router.delete('/:id', auth, role('restaurateur', 'admin'), deleteCategory);

module.exports = router;
