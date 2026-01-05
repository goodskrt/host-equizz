/**
 * Script pour tester que le populate fonctionne maintenant avec l'import du modèle Class
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const { Class } = require('../models/Academic');
require('dotenv').config();

const testPopulateFix = async () => {
  try {
    // Connexion à la base de données
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connexion à MongoDB réussie');

    console.log('\n🧪 Test du populate après correction...');
    
    // Test exactement comme dans l'authController
    const user = await User.findOne({ matricule: '2223i278' }).populate('classId');
    
    if (!user) {
      console.error('❌ Utilisateur non trouvé');
      return;
    }
    
    console.log('✅ Utilisateur trouvé avec populate:');
    console.log('   - Nom:', `${user.firstName} ${user.lastName}`);
    console.log('   - Matricule:', user.matricule);
    console.log('   - ClassId type:', typeof user.classId);
    console.log('   - ClassId value:', user.classId);
    
    if (user.classId) {
      console.log('\n📚 Détails de la classe populée:');
      console.log('   - Code:', user.classId.code);
      console.log('   - Spécialité:', user.classId.speciality);
      console.log('   - Niveau:', user.classId.level);
      console.log('   - Langue:', user.classId.language);
      
      // Simuler exactement ce que fait l'authController
      const apiUserData = {
        id: user._id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role.toLowerCase(),
        matricule: user.matricule,
        classId: user.classId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
      
      console.log('\n🎯 Données utilisateur comme dans l\'API:');
      console.log('   - classId.code:', apiUserData.classId.code);
      
      // Test de ce que le frontend recevra
      const frontendClassDisplay = apiUserData?.classId?.code || 'N/D';
      console.log('   - Affichage frontend:', frontendClassDisplay);
      
      if (frontendClassDisplay === 'ING4-ISI-FR') {
        console.log('\n✅ SUCCESS: Le frontend devrait maintenant afficher "ING4-ISI-FR" !');
      } else {
        console.log('\n❌ PROBLEM: Le frontend affichera encore "N/D"');
      }
      
    } else {
      console.log('\n❌ PROBLEM: Aucune classe populée');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnexion de MongoDB');
  }
};

// Exécuter le test
testPopulateFix();