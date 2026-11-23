const Commande = require('../models/Commande');
const LigneCommande = require('../models/LigneCommande');
const { HttpError, isId, getManagedRestaurant } = require('../utils/ownership');

// Liste des statuts valides : en_attente, acceptee, livre, annulee
const STATUTS = Object.keys(Commande.TRANSITIONS);

// ===========================================================================
// FONCTIONS UTILITAIRES (non exportées)
// ===========================================================================

// Lit le filtre optionnel ?statut=... dans l'URL.
// Retourne {} (pas de filtre) ou { statut: 'xxx' }. Une valeur invalide donne une erreur 400.
const lireFiltreStatut = (req) => {
  const { statut } = req.query;
  if (statut === undefined || statut === '') return {};
  if (typeof statut !== 'string' || !STATUTS.includes(statut)) {
    throw new HttpError(400, `Statut invalide (valeurs possibles : ${STATUTS.join(', ')})`);
  }
  return { statut };
};

// Ajoute à chaque commande la liste de ses lignes (plats commandés).
// Une seule requête pour toutes les commandes (au lieu d'une requête par commande).
const avecLignes = async (commandes) => {
  // 1) Récupérer toutes les lignes dont la commande est dans la liste
  const lignes = await LigneCommande.find({ commande: { $in: commandes.map((c) => c._id) } }).sort({
    createdAt: 1,
  });

  // 2) Regrouper les lignes par identifiant de commande
  const parCommande = new Map();
  for (const l of lignes) {
    const cle = String(l.commande);
    if (!parCommande.has(cle)) parCommande.set(cle, []);
    parCommande.get(cle).push(l);
  }

  // 3) Retourner chaque commande (en JSON) avec son tableau « lignes »
  return commandes.map((c) => ({ ...c.toJSON(), lignes: parCommande.get(String(c._id)) || [] }));
};

// Champs à remplacer par les vrais documents (« populate ») :
// le nom du restaurant et les coordonnées du client (utiles pour la livraison).
const POPULATE = [
  { path: 'restaurant', select: 'nom adresse' },
  { path: 'client', select: 'nom prenom telephone' },
];

// Retourne les commandes correspondant au filtre, la plus récente d'abord, avec leurs lignes.
const lister = async (filtre) => {
  const commandes = await Commande.find(filtre).sort({ dateCreation: -1, _id: -1 }).populate(POPULATE);
  return avecLignes(commandes);
};

// Retourne UNE commande prête à être envoyée au frontend (populate + lignes).
const vue = async (commande) => {
  await commande.populate(POPULATE);
  return (await avecLignes([commande]))[0];
};

// Vérifie que l'utilisateur connecté a le droit d'accéder à la commande, puis la retourne.
//  - client        : uniquement ses propres commandes
//  - restaurateur  : uniquement les commandes de SON restaurant
// Dans les cas interdits on répond 404 (et non 403) pour ne pas révéler
// qu'une commande appartenant à quelqu'un d'autre existe.
const commandeAutorisee = async (user, id) => {
  if (!isId(id)) throw new HttpError(400, 'Identifiant invalide');

  const commande = await Commande.findById(id);
  if (!commande) throw new HttpError(404, 'Commande introuvable');

  if (user.role === 'client') {
    // La commande doit appartenir au client connecté
    if (!commande.client.equals(user._id)) throw new HttpError(404, 'Commande introuvable');
  } else {
    // Le restaurateur doit posséder le restaurant de la commande
    // (getManagedRestaurant répond 403 s'il n'a pas encore créé son restaurant)
    const restaurant = await getManagedRestaurant(user);
    if (!commande.restaurant.equals(restaurant._id)) throw new HttpError(404, 'Commande introuvable');
  }
  return commande;
};

// ===========================================================================
// CÔTÉ CLIENT
// ===========================================================================

// GET /api/commandes/mes-commandes[?statut=en_attente]
// Tâche 1 : historique des commandes du client connecté (la plus récente d'abord).
exports.historique = async (req, res) => {
  const filtre = { client: req.user._id, ...lireFiltreStatut(req) };
  res.json(await lister(filtre));
};

// PATCH /api/commandes/:id/annuler
// Tâche 3 : le client annule une commande, seulement si elle est encore « en attente ».
exports.annuler = async (req, res) => {
  const commande = await commandeAutorisee(req.user, req.params.id);
  if (commande.statut !== 'en_attente') {
    throw new HttpError(409, 'Seule une commande en attente peut être annulée');
  }
  await commande.annuler();
  res.json(await vue(commande));
};

// ===========================================================================
// CÔTÉ RESTAURATEUR
// ===========================================================================

// GET /api/commandes/restaurant[?statut=en_attente]
// Tâche 4 : commandes reçues par MON restaurant.
// Les « nouvelles commandes » sont obtenues avec ?statut=en_attente.
exports.commandesRestaurant = async (req, res) => {
  const restaurant = await getManagedRestaurant(req.user);
  const filtre = { restaurant: restaurant._id, ...lireFiltreStatut(req) };
  res.json(await lister(filtre));
};

// PATCH /api/commandes/:id/accepter
// Tâche 6 : en_attente -> acceptee
exports.accepter = async (req, res) => {
  const commande = await commandeAutorisee(req.user, req.params.id);
  await commande.accepter();
  res.json(await vue(commande));
};

// PATCH /api/commandes/:id/refuser
// Tâche 7 : en_attente -> annulee
// Tâche 7 : en_attente -> annulee, avec un motif obligatoire    corps : { "motif": "Plat indisponible" }
exports.refuser = async (req, res) => {
  const motif = typeof req.body?.motif === 'string' ? req.body.motif.trim() : '';
  if (motif.length < 3) throw new HttpError(400, 'Le motif du refus est obligatoire (3 caractères minimum)');
  if (motif.length > 300) throw new HttpError(400, 'Le motif ne doit pas dépasser 300 caractères');

  const commande = await commandeAutorisee(req.user, req.params.id);
  await commande.refuser(motif);
  res.json(await vue(commande));
};

// PATCH /api/commandes/:id/statut   corps : { "statut": "livre" }
// Tâche 8 : modifier le statut (ex. acceptee -> livre).
// Seules les transitions du cycle de vie sont acceptées (voir Commande.TRANSITIONS).
exports.modifierStatut = async (req, res) => {
  const { statut } = req.body;
  if (typeof statut !== 'string' || !STATUTS.includes(statut)) {
    throw new HttpError(400, `Statut invalide (valeurs possibles : ${STATUTS.join(', ')})`);

  }
    // Un refus doit passer par /refuser, pour que le motif soit obligatoire
  if (statut === 'annulee') {
    throw new HttpError(400, 'Pour refuser une commande, utilisez la route /refuser avec un motif');
  }
  const commande = await commandeAutorisee(req.user, req.params.id);
  await commande.changerStatut(statut);
  res.json(await vue(commande));
};

// ===========================================================================
// CLIENT ET RESTAURATEUR
// ===========================================================================

// GET /api/commandes/:id
// Tâches 2 et 5 : détail d'une commande.
// Le client s'en sert pour suivre le statut, le restaurateur pour voir le détail.
exports.detail = async (req, res) => {
  const commande = await commandeAutorisee(req.user, req.params.id);
  res.json(await vue(commande));
};