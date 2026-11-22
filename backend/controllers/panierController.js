const Panier = require('../models/Panier');
const LignePanier = require('../models/LignePanier');
const Commande = require('../models/Commande');
const LigneCommande = require('../models/LigneCommande');
const Dish = require('../models/Dish');
const Restaurant = require('../models/Restaurant');
const { HttpError, isId } = require('../utils/ownership');

const round2 = (n) => Math.round(n * 100) / 100;
const MAX_QTE = 99;

const PANIER_VIDE = {
  _id: null,
  restaurant: null,
  adresseLivraison: '',
  sousTotal: 0,
  fraisLivraison: 0,
  total: 0,
  lignes: [],
};

// Recalcule sousTotal et fraisLivraison du panier à partir des prix actuels des plats.
// Supprime les lignes dont le plat n'existe plus. Un panier sans ligne est supprimé (retourne null).
const synchroniser = async (panier) => {
  if (!panier) return null;
  const lignes = await LignePanier.find({ panier: panier._id }).populate('plat');
  const orphelines = lignes.filter((l) => !l.plat);
  if (orphelines.length > 0) {
    await LignePanier.deleteMany({ _id: { $in: orphelines.map((l) => l._id) } });
  }
  const valides = lignes.filter((l) => l.plat);
  if (valides.length === 0) {
    await panier.deleteOne();
    return null;
  }
  const restaurant = await Restaurant.findById(panier.restaurant);
  panier.sousTotal = round2(valides.reduce((s, l) => s + l.quantite * l.plat.prix, 0));
  panier.fraisLivraison = restaurant?.fraisLivraison || 0;
    panier.total = round2(panier.sousTotal + panier.fraisLivraison);
  await panier.save();
  return panier;
};

// Représentation envoyée au frontend : panier + restaurant + lignes (avec le plat)
const vue = async (panier) => {
  if (!panier) return PANIER_VIDE;
  const [lignes, restaurant] = await Promise.all([
    LignePanier.find({ panier: panier._id }).populate('plat', 'nom prix image disponible').sort({ createdAt: 1 }),
    Restaurant.findById(panier.restaurant).select('nom fraisLivraison isOpen'),
  ]);
  return {
    _id: panier._id,
    restaurant,
    adresseLivraison: panier.adresseLivraison,
    sousTotal: panier.sousTotal,
    fraisLivraison: panier.fraisLivraison,
    total: panier.total,
    lignes: lignes.map((l) => ({ _id: l._id, plat: l.plat, quantite: l.quantite, sousTotal: l.sousTotal })),
  };
};

const supprimerPanier = async (panier) => {
  await LignePanier.deleteMany({ panier: panier._id });
  await panier.deleteOne();
};

// Retourne la ligne seulement si elle appartient au panier du client connecté
const ligneDuClient = async (user, ligneId) => {
  if (!isId(ligneId)) throw new HttpError(400, 'Identifiant invalide');
  const ligne = await LignePanier.findById(ligneId);
  const panier = ligne && (await Panier.findById(ligne.panier));
  if (!ligne || !panier || !panier.client.equals(user._id)) throw new HttpError(404, 'Ligne introuvable');
  return { ligne, panier };
};

// GET /api/panier : consulter le panier
exports.consulterPanier = async (req, res) => {
  const panier = await synchroniser(await Panier.findOne({ client: req.user._id }));
  res.json(await vue(panier));
};

// POST /api/panier/plats  { plat, quantite = 1, remplacer? } : ajouterPlat()
// Un panier ne contient que les plats d'un restaurant : si le client ajoute un plat d'un autre restaurant,
// on répond 409 (code AUTRE_RESTAURANT) et le client peut renvoyer la requête avec remplacer: true.
exports.ajouterPlat = async (req, res) => {
  const { plat, remplacer } = req.body;
  const quantite = req.body.quantite === undefined ? 1 : Number(req.body.quantite);
  if (!isId(plat)) throw new HttpError(400, 'Plat invalide');
  if (!Number.isInteger(quantite) || quantite < 1 || quantite > MAX_QTE) {
    throw new HttpError(400, `La quantité doit être un entier entre 1 et ${MAX_QTE}`);
  }

  const dish = await Dish.findById(plat);
  if (!dish) throw new HttpError(404, 'Plat introuvable');
  const restaurant = await Restaurant.findById(dish.restaurant);
  if (!restaurant || restaurant.statut !== 'valide') throw new HttpError(404, 'Restaurant introuvable');
  if (!restaurant.isOpen) throw new HttpError(400, `${restaurant.nom} est actuellement fermé`);
  if (!dish.disponible) throw new HttpError(400, 'Ce plat est indisponible');

  let panier = await Panier.findOne({ client: req.user._id });
  if (panier && !panier.restaurant.equals(restaurant._id)) {
    if (remplacer !== true) {
      return res.status(409).json({
        code: 'AUTRE_RESTAURANT',
        message: "Votre panier contient des plats d'un autre restaurant.",
      });
    }
     await supprimerPanier(panier);
    panier = null;
  }
  if (!panier) {
    panier = await Panier.create({
      client: req.user._id,
      restaurant: restaurant._id,
      fraisLivraison: restaurant.fraisLivraison || 0,
    });
  }

  const ligne = await LignePanier.findOne({ panier: panier._id, plat: dish._id });
  if (ligne) {
    ligne.quantite = Math.min(ligne.quantite + quantite, MAX_QTE);
    await ligne.save();
  } else {
    await LignePanier.create({ panier: panier._id, plat: dish._id, quantite });
  }

  res.status(201).json(await vue(await synchroniser(panier)));
};

// PATCH /api/panier/plats/:ligneId  { delta: 1 | -1 } : modifierQuantite()
exports.modifierQuantite = async (req, res) => {
  const { ligne, panier } = await ligneDuClient(req.user, req.params.ligneId);
  const delta = Number(req.body.delta);
  if (delta !== 1 && delta !== -1) throw new HttpError(400, 'delta doit valoir 1 ou -1');

  ligne.quantite = Math.min(Math.max(ligne.quantite + delta, 1), MAX_QTE);
  await ligne.save();
  res.json(await vue(await synchroniser(panier)));
};

// DELETE /api/panier/plats/:ligneId : supprimerPlat()
exports.supprimerPlat = async (req, res) => {
  const { ligne, panier } = await ligneDuClient(req.user, req.params.ligneId);
  await ligne.deleteOne();
  res.json(await vue(await synchroniser(panier)));
};

// PUT /api/panier/adresse  { adresseLivraison } : saisirAdresse()
exports.saisirAdresse = async (req, res) => {
  const adresse = typeof req.body.adresseLivraison === 'string' ? req.body.adresseLivraison.trim() : '';
  if (!adresse) throw new HttpError(400, "L'adresse de livraison est obligatoire");
  const panier = await Panier.findOne({ client: req.user._id });
  if (!panier) throw new HttpError(400, 'Votre panier est vide');
  panier.adresseLivraison = adresse;
  await panier.save();
  res.json(await vue(await synchroniser(panier)));
};

// DELETE /api/panier : vider le panier
exports.viderPanier = async (req, res) => {
  const panier = await Panier.findOne({ client: req.user._id });
  if (panier) await supprimerPanier(panier);
  res.json(PANIER_VIDE);
};

// POST /api/panier/commander  { adresseLivraison? } : passerCommande()
// Crée la Commande et ses LigneCommande à partir du Panier (prix relus en base), puis supprime le Panier.
exports.passerCommande = async (req, res) => {
  let panier = await Panier.findOne({ client: req.user._id });
  if (!panier) throw new HttpError(400, 'Votre panier est vide');

  if (typeof req.body.adresseLivraison === 'string' && req.body.adresseLivraison.trim()) {
    panier.adresseLivraison = req.body.adresseLivraison.trim();
  }
  if (!panier.adresseLivraison) throw new HttpError(400, "L'adresse de livraison est obligatoire");

  panier = await synchroniser(panier);
  if (!panier) throw new HttpError(400, 'Votre panier est vide');

  const restaurant = await Restaurant.findById(panier.restaurant);
  if (!restaurant || restaurant.statut !== 'valide') throw new HttpError(404, 'Restaurant introuvable');
  if (!restaurant.isOpen) throw new HttpError(400, `${restaurant.nom} est actuellement fermé`);

  const lignes = await LignePanier.find({ panier: panier._id }).populate('plat');
  const indisponibles = lignes.filter((l) => !l.plat.disponible);
  if (indisponibles.length > 0) {
    throw new HttpError(400, `Plat(s) indisponible(s) : ${indisponibles.map((l) => l.plat.nom).join(', ')}`);
  }

    const fraisLivraison = restaurant.fraisLivraison || 0;
  const commande = await Commande.create({
    client: req.user._id,
    restaurant: restaurant._id,
    adresseLivraison: panier.adresseLivraison,
    sousTotal: panier.sousTotal,
    fraisLivraison,
    total: round2(panier.sousTotal + fraisLivraison),
  });

  try {
    await LigneCommande.insertMany(
      lignes.map((l) => ({
        commande: commande._id,
        plat: l.plat._id,
        nomPlat: l.plat.nom,
        quantite: l.quantite,
        prixUnitaire: l.plat.prix,
      }))
    );
  } catch (err) {
    await Commande.deleteOne({ _id: commande._id }); // pas de commande sans lignes
    throw err;
  }

  //vider le panier sur le base 
 //await supprimerPanier(panier);

  const lignesCommande = await LigneCommande.find({ commande: commande._id });
  res.status(201).json({ ...commande.toJSON(), lignes: lignesCommande });
};