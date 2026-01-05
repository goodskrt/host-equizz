/**
 * Test de l'endpoint du profil utilisateur pour vérifier les données de classe
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const { Class } = require('../models/Academic');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const testProfileEndpoint = async () => {
  try {
    // Connexion à la base de données
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connexion à MongoDB réussie');

    console.log('\n🧪 Test de l\'endpoint du profil utilisateur...');
    
    // ÉTAPE 1: Récupérer l'utilisateur de test
    const user = await User.findOne({ matricule: '2223i278' });
    if (!user) {
      console.error('❌ Utilisateur de test non trouvé');
      return;
    }
    
    console.log('✅ Utilisateur trouvé:', user.firstName, user.lastName);
    
    // ÉTAPE 2: Simuler exactement ce que fait l'endpoint getProfile
    console.log('\n📋 ÉTAPE 2: Simulation de l\'endpoint getProfile');
    
    const profileUser = await User.findById(user._id).populate('classId').select('-password');
    
    if (!profileUser) {
      console.error('❌ Erreur lors de la récupération du profil');
      return;
    }
    
    console.log('✅ Profil récupéré avec populate');
    console.log('   - ClassId type:', typeof profileUser.classId);
    console.log('   - ClassId value:', profileUser.classId);
    
    // ÉTAPE 3: Générer la réponse comme l'endpoint
    const profileResponse = {
      success: true,
      data: {
        id: profileUser._id,
        email: profileUser.email,
        name: `${profileUser.firstName} ${profileUser.lastName}`,
        role: profileUser.role.toLowerCase(),
        matricule: profileUser.matricule,
        classId: profileUser.classId,
        createdAt: profileUser.createdAt,
        updatedAt: profileUser.updatedAt
      }
    };
    
    console.log('\n📤 RÉPONSE DE L\'ENDPOINT PROFILE:');
    console.log('   - Success:', profileResponse.success);
    console.log('   - Nom:', profileResponse.data.name);
    console.log('   - Matricule:', profileResponse.data.matricule);
    console.log('   - ClassId:', profileResponse.data.classId);
    
    if (profileResponse.data.classId) {
      console.log('\n📚 Détails de la classe dans le profil:');
      console.log('   - Code:', profileResponse.data.classId.code);
      console.log('   - Spécialité:', profileResponse.data.classId.speciality);
      console.log('   - Niveau:', profileResponse.data.classId.level);
      console.log('   - Langue:', profileResponse.data.classId.language);
      
      // Test de ce que le frontend recevra pour le profil
      const frontendClassDisplay = profileResponse.data.classId?.code || 'N/A';
      console.log('\n🖥️ Affichage frontend dans le profil:', frontendClassDisplay);
      
      if (frontendClassDisplay === 'ING4-ISI-FR') {
        console.log('✅ SUCCESS: Le profil affichera "ING4-ISI-FR" !');
      } else {
        console.log('❌ PROBLEM: Le profil affichera "N/A"');
      }
    } else {
      console.log('\n❌ PROBLEM: Aucune classe dans la réponse du profil');
    }
    
    // ÉTAPE 4: Test avec un token JWT (simulation complète)
    console.log('\n🔑 ÉTAPE 4: Test avec token JWT');
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    console.log('   - Token généré pour l\'utilisateur');
    
    // Décoder le token pour simuler le middleware d'authentification
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('   - Token décodé, user ID:', decoded.id);
    
    // Simuler req.user.id dans l'endpoint
    const reqUserId = decoded.id;
    const endpointUser = await User.findById(reqUserId).populate('classId').select('-password');
    
    console.log('   - Utilisateur récupéré via token:', endpointUser ? 'OK' : 'KO');
    console.log('   - Classe via token:', endpointUser?.classId?.code || 'N/A');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnexion de MongoDB');
  }
};

// Exécuter le test
testProfileEndpoint();