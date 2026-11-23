const mongoose = require('mongoose');

const round2 = (n) => Math.round(n * 100) / 100;

// Classe Commande, créée par Panier.passerCommande().
// Paiement unique : espèces à la livraison, donc aucun attribut « mode de paiement ».
const commandeSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    adresseLivraison: { type: String, required: [true, "L'adresse de livraison est obligatoire"], trim: true },
    statut: {
      type: String,
      enum: ['en_attente', 'acceptee', 'livre', 'annulee'], // énumération StatutCommande
      default: 'en_attente',
      index: true,
    },
    sousTotal: { type: Number, required: true, min: 0 },
    fraisLivraison: { type: Number, required: true, min: 0 },
        total: { type: Number, required: true, min: 0 },
         motifRefus: { type: String, trim: true, maxlength: [300, 'Le motif ne doit pas dépasser 300 caractères'] },
    dateCreation: { type: Date, default: Date.now },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true }, id: false }
);



// +calculerTotal() : Double
commandeSchema.methods.calculerTotal = function () {
  return round2(this.sousTotal + this.fraisLivraison);
};

// ===========================================================================
// PERSONNE 4 : cycle de vie d'une commande
// ===========================================================================

// Table des transitions autorisées.
// Clé = statut actuel ; valeur = liste des statuts vers lesquels on peut aller.
//   en_attente -> acceptee : le restaurateur accepte la commande
//   en_attente -> annulee  : le client annule, OU le restaurateur refuse
//   acceptee   -> livre    : le restaurateur marque la commande comme livrée
// « livre » et « annulee » sont des états finaux : plus aucun changement (règle 9).
const TRANSITIONS = {
  en_attente: ['acceptee', 'annulee'],
  acceptee: ['livre'],
  livre: [],
  annulee: [],
};

// Propriété statique : accessible partout avec Commande.TRANSITIONS
// (le contrôleur s'en sert pour connaître la liste des statuts valides).
commandeSchema.statics.TRANSITIONS = TRANSITIONS;

// Méthode générique : change le statut si la transition est autorisée.
// Les trois méthodes du diagramme de classes (accepter, refuser, annuler) l'appellent.
commandeSchema.methods.changerStatut = async function (nouveauStatut, champsSupp = {}) {   // ← MODIF 1
  // 1) Vérifier que la transition est permise depuis le statut actuel
  const permis = TRANSITIONS[this.statut] || [];
  if (!permis.includes(nouveauStatut)) {
    const err = new Error(`Transition impossible : « ${this.statut} » vers « ${nouveauStatut} »`);
    err.status = 409;
    throw err;
  }

  // 2) Mise à jour atomique
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

  // 3) Mettre à jour l'objet en mémoire et le retourner
  this.statut = nouveauStatut;
  this.set(champsSupp);                                                                     // ← MODIF 3
  return this;
};

// +accepter() : en_attente -> acceptee (restaurateur)
commandeSchema.methods.accepter = function () {
  return this.changerStatut('acceptee');
};

// +refuser(motif) : en_attente -> annulee (restaurateur), avec le motif du refus
commandeSchema.methods.refuser = function (motif) {
  return this.changerStatut('annulee', { motifRefus: motif });
};

// +annuler() : en_attente -> annulee (client)
commandeSchema.methods.annuler = function () {
  return this.changerStatut('annulee');
};

module.exports = mongoose.model('Commande', commandeSchema);