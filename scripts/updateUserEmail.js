/**
 * Script pour modifier l'adresse email d'un utilisateur spécifique
 */

const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const updateUserEmail = async () => {
  try {
    // Connexion à la base de données
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connexion à MongoDB réussie');

    // Rechercher l'utilisateur IGRE URBAIN LEPONTIFE
    const oldEmail = 'igre.urbain@institutsaintjean.org';
    const newEmail = 'urbain.igre@saintjeaningenieur.org';

    console.log(`🔍 Recherche de l'utilisateur avec l'email: ${oldEmail}`);

    const user = await User.findOne({ email: oldEmail });

    if (!user) {
      console.log('❌ Utilisateur non trouvé avec cet email');
      return;
    }

    console.log('👤 Utilisateur trouvé:');
    console.log(`   - Nom: ${user.firstName} ${user.lastName}`);
    console.log(`   - Email actuel: ${user.email}`);
    console.log(`   - Matricule: ${user.matricule}`);
    console.log(`   - Rôle: ${user.role}`);

    // Vérifier si le nouvel email existe déjà
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser) {
      console.log(`❌ Un utilisateur avec l'email ${newEmail} existe déjà`);
      console.log(`   - Nom: ${existingUser.firstName} ${existingUser.lastName}`);
      return;
    }

    // Mettre à jour l'email
    console.log(`\n🔄 Mise à jour de l'email vers: ${newEmail}`);
    
    user.email = newEmail;
    await user.save();

    console.log('✅ Email mis à jour avec succès !');
    
    // Vérification
    const updatedUser = await User.findById(user._id);
    console.log('\n📋 Vérification:');
    console.log(`   - Nom: ${updatedUser.firstName} ${updatedUser.lastName}`);
    console.log(`   - Nouvel email: ${updatedUser.email}`);
    console.log(`   - Matricule: ${updatedUser.matricule}`);
    console.log(`   - Modifié le: ${updatedUser.updatedAt.toLocaleString('fr-FR')}`);

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnexion de MongoDB');
  }
};

// Exécuter le script
updateUserEmail();