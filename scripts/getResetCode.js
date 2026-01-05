/**
 * Script pour récupérer le code de réinitialisation depuis la base de données
 */

const mongoose = require('mongoose');
const PasswordReset = require('../models/PasswordReset');
require('dotenv').config();

const getResetCode = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connexion à MongoDB réussie');

    const resetRecord = await PasswordReset.findOne({ 
      email: 'igre.urbain@institutsaintjean.org' 
    }).sort({ createdAt: -1 });

    if (resetRecord) {
      console.log('📧 Code de réinitialisation trouvé:');
      console.log('   - Email:', resetRecord.email);
      console.log('   - Code:', resetRecord.code);
      console.log('   - Créé le:', resetRecord.createdAt);
      console.log('   - Expire le:', resetRecord.expiresAt);
      console.log('   - Utilisé:', resetRecord.used);
    } else {
      console.log('❌ Aucun code de réinitialisation trouvé');
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
  }
};

getResetCode();