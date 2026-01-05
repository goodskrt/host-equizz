const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  code: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
  },
  used: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index pour supprimer automatiquement les codes expirés
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index pour optimiser les recherches par email et code
passwordResetSchema.index({ email: 1, code: 1 });

module.exports = mongoose.model('PasswordReset', passwordResetSchema);