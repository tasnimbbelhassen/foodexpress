const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const { getMe, updateMe, updatePassword } = require('../controllers/userController');

router.use(auth); // toutes ces routes exigent d'être connecté

router.get('/me', getMe);
router.put('/me', updateMe);
router.put('/me/password', updatePassword);

module.exports = router;