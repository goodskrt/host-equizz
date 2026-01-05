/**
 * Script pour vérifier l'email d'un utilisateur spécifique
 */

const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const checkUserEmail = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connexion MongoDB reussie');

    // Rechercher l'utilisateur par matricule
    const user = await User.findOne({ matricule: '2223i278' });

    if (user) {
      console.log('Utilisateur trouve:');
      console.log('- Nom:', user.firstName, user.lastName);
      console.log('- Email:', user.email);
      console.log('- Matricule:', user.matricule);
      console.log('- Modifie le:', user.updatedAt.toLocaleString('fr-FR'));
    } else {
      console.log('Utilisateur non trouve');
    }

  } catch (error) {
    console.error('Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Deconnexion MongoDB');
  }
};

checkUserEmail();