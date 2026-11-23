const router = require('express').Router();
const auth = require('../middleware/authMiddleware'); // vérifie le token JWT
const role = require('../middleware/roleMiddleware'); // vérifie le rôle de l'utilisateur
const c = require('../controllers/commandeController');

// Personne 4 : suivi et traitement des commandes.
// Toutes les routes exigent d'être connecté.
router.use(auth);

// --- Côté client ---
router.get('/mes-commandes', role('client'), c.historique); // historique
router.patch('/:id/annuler', role('client'), c.annuler); // annuler une commande en attente

// --- Côté restaurateur ---
// ATTENTION : les routes fixes comme '/restaurant' doivent rester AVANT '/:id',
// sinon Express prendrait le mot « restaurant » pour un identifiant.
router.get('/restaurant', role('restaurateur'), c.commandesRestaurant); // ?statut=en_attente pour les nouvelles
router.patch('/:id/accepter', role('restaurateur'), c.accepter);
router.patch('/:id/refuser', role('restaurateur'), c.refuser);
router.patch('/:id/statut', role('restaurateur'), c.modifierStatut);

// --- Client et restaurateur : détail / suivi d'une commande ---
router.get('/:id', role('client', 'restaurateur'), c.detail);

module.exports = router;