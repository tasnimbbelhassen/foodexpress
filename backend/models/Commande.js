
const mongoose = require('mongoose'); // Bibliothèque pour gérer MongoDB

// Arrondit un nombre à deux chiffres après la virgule
const round2 = (n) => Math.round(n * 100) / 100;

// Définition du schéma Commande : représente une commande passée par un client
const commandeSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // Client ayant passé la commande
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true }, // Restaurant concerné
    adresseLivraison: { type: String, required: [true, "L'adresse de livraison est obligatoire"], trim: true }, // Adresse de livraison

    // Statut de la commande : définit son état actuel
    statut: {
      type: String,
      enum: ['en_attente', 'acceptee', 'livre', 'annulee'],
      default: 'en_attente',
      index: true,
    },

    sousTotal: { type: Number, required: true, min: 0 }, // Total des plats commandés
    fraisLivraison: { type: Number, required: true, min: 0 }, // Frais de livraison
    total: { type: Number, required: true, min: 0 }, // Montant total à payer
    motifRefus: { type: String, trim: true, maxlength: [300, 'Le motif ne doit pas dépasser 300 caractères'] }, // Motif du refus par le restaurateur
    dateCreation: { type: Date, default: Date.now }, // Date de création de la commande
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true }, id: false }
);

// Calcule le montant total : sous-total + frais de livraison
commandeSchema.methods.calculerTotal = function () {
  return round2(this.sousTotal + this.fraisLivraison);
};

// Définition des transitions autorisées entre les différents statuts
const TRANSITIONS = {
  en_attente: ['acceptee', 'annulee'], // Peut être acceptée ou annulée
  acceptee: ['livre'], // Une commande acceptée peut être livrée
  livre: [], // État final : aucun changement possible
  annulee: [], // État final : aucun changement possible
};

// Propriété statique permettant d'accéder aux transitions via Commande.TRANSITIONS
commandeSchema.statics.TRANSITIONS = TRANSITIONS;

// Méthode générique pour changer le statut d'une commande
commandeSchema.methods.changerStatut = async function (nouveauStatut, champsSupp = {}) {   // ← MODIF 1
  // Vérifie si le changement de statut est autorisé
  const permis = TRANSITIONS[this.statut] || [];
  if (!permis.includes(nouveauStatut)) {
    const err = new Error(`Transition impossible : « ${this.statut} » vers « ${nouveauStatut} »`);
    err.status = 409;
    throw err;
  }

  // Met à jour le statut dans MongoDB uniquement s'il n'a pas changé entre-temps
  const res = await this.constructor.updateOne(
    { _id: this._id, statut: this.statut },
    { statut: nouveauStatut, ...champsSupp },                                               // ← MODIF 2
    { runValidators: true }
  );
  if (res.matchedCount === 0) {
    const err = new Error('Le statut de cette commande vient de changer. Actualisez la page.');
    err.status = 409;
    throw err;
  }

  // Synchronise l'objet en mémoire avec les nouvelles valeurs
  this.statut = nouveauStatut;
  this.set(champsSupp);                                                                     // ← MODIF 3
  return this;
};

// Accepter une commande : en_attente → acceptee
commandeSchema.methods.accepter = function () {
  return this.changerStatut('acceptee');
};

// Refuser une commande : en_attente → annulee, avec enregistrement du motif
commandeSchema.methods.refuser = function (motif) {
  return this.changerStatut('annulee', { motifRefus: motif });
};

// Annuler une commande : en_attente → annulee
commandeSchema.methods.annuler = function () {
  return this.changerStatut('annulee');
};

// Création et exportation du modèle Commande
module.exports = mongoose.model('Commande', commandeSchema);
