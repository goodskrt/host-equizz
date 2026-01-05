/**
 * Script pour tester la réponse de l'API d'authentification par carte
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const { Class } = require('../models/Academic'); // Import du modèle Class
require('dotenv').config();

const testApiResponse = async () => {
  try {
    // Connexion à la base de données
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connexion à MongoDB réussie');

    // Simuler ce que fait l'API d'authentification par carte
    console.log('\n🧪 Test de la réponse API d\'authentification par carte');
    
    // Recherche de l'utilisateur avec populate (comme dans l'API)
    const user = await User.findOne({ matricule: '2223i278' }).populate('classId');
    
    if (!user) {
      console.error('❌ Utilisateur non trouvé');
      return;
    }
    
    console.log('✅ Utilisateur trouvé avec populate:');
    console.log('📋 Données brutes user.classId:', user.classId);
    
    // Simuler la réponse de l'API (comme dans authController.js)
    const apiResponse = {
      success: true,
      message: 'Authentification par carte réussie',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role.toLowerCase(),
          matricule: user.matricule,
          classId: user.classId,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        token: 'fake-token-for-test',
        cardInfo: {
          matricule: '2223i278',
          name: 'IGRE URBAIN LEPONTIFE'
        }
      }
    };
    
    console.log('\n📤 Réponse API simulée:');
    console.log('🔍 Structure complète:', JSON.stringify(apiResponse, null, 2));
    
    console.log('\n🎯 Données utilisateur dans la réponse:');
    console.log('   - ID:', apiResponse.data.user.id);
    console.log('   - Nom:', apiResponse.data.user.name);
    console.log('   - Matricule:', apiResponse.data.user.matricule);
    console.log('   - ClassId:', apiResponse.data.user.classId);
    
    if (apiResponse.data.user.classId) {
      console.log('\n📚 Détails de la classe:');
      console.log('   - Code:', apiResponse.data.user.classId.code);
      console.log('   - Spécialité:', apiResponse.data.user.classId.speciality);
      console.log('   - Niveau:', apiResponse.data.user.classId.level);
      console.log('   - Langue:', apiResponse.data.user.classId.language);
    } else {
      console.log('❌ Aucune classe trouvée dans la réponse');
    }
    
    // Test de ce que le frontend devrait recevoir
    console.log('\n🖥️ Ce que le frontend devrait afficher:');
    const userData = apiResponse.data.user;
    const classDisplay = userData?.classId?.code || 'N/D';
    console.log('   - Classe affichée:', classDisplay);
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnexion de MongoDB');
  }
};

// Exécuter le test
testApiResponse();