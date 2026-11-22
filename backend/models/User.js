const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    nom: { type: String, required: [true, 'Le nom est obligatoire'], trim: true },
    prenom: { type: String, required: [true, 'Le prénom est obligatoire'], trim: true },
    email: {
      type: String,
      required: [true, "L'email est obligatoire"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email invalide'],
    },
    telephone: { type: String, required: [true, 'Le téléphone est obligatoire'], trim: true },
    password: {
      type: String,
      required: [true, 'Le mot de passe est obligatoire'],
      minlength: [8, 'Le mot de passe doit contenir au moins 8 caractères'],
      select: false,
    },
    role: {
      type: String,
      enum: ['client', 'restaurateur', 'admin'],
      default: 'client',
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);


userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', userSchema);