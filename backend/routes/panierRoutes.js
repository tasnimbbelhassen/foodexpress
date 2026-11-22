const router = require('express').Router();
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const c = require('../controllers/panierController');

// Personne 3 : panier et validation de commande (réservé aux clients)
router.use(auth, role('client'));

router.get('/', c.consulterPanier);
router.delete('/', c.viderPanier);
router.post('/plats', c.ajouterPlat);
router.patch('/plats/:ligneId', c.modifierQuantite);
router.delete('/plats/:ligneId', c.supprimerPlat);
router.put('/adresse', c.saisirAdresse);
router.post('/commander', c.passerCommande);

module.exports = router;