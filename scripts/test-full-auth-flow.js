/**
 * Test complet du flux d'authentification par carte
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const { Class } = require('../models/Academic');
const { 
  preprocessImage, 
  performOCR, 
  cleanOCRText, 
  parseCardData, 
  validateCardData 
} = require('../controllers/ocrController');
require('dotenv').config();

const testFullAuthFlow = async () => {
  try {
    // Connexion à la base de données
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connexion à MongoDB réussie');

    console.log('\n🧪 Test complet du flux d\'authentification par carte...');
    
    // ÉTAPE 1: Simuler l'extraction OCR
    console.log('\n📋 ÉTAPE 1: Simulation OCR');
    const simulatedOCRText = `
      INSTITUT SAINT JEAN
      CARTE D'ETUDIANT
      
      Matricule: 2223i278
      Nom(s): IGRE URBAIN LEPONTIFE
      Né(e) le - 2 avril 2005
      À DOUALA
    `;
    
    // ÉTAPE 2: Nettoyage du texte
    console.log('🧹 ÉTAPE 2: Nettoyage du texte');
    const cleanedText = cleanOCRText(simulatedOCRText);
    
    // ÉTAPE 3: Parsing des données
    console.log('📊 ÉTAPE 3: Parsing des données');
    const cardData = parseCardData(cleanedText);
    console.log('   - Matricule extrait:', cardData.matricule);
    console.log('   - Nom extrait:', cardData.name);
    
    // ÉTAPE 4: Validation des données
    console.log('✅ ÉTAPE 4: Validation des données');
    const validation = validateCardData(cardData);
    console.log('   - Validation:', validation.isValid ? 'OK' : 'KO');
    if (!validation.isValid) {
      console.log('   - Erreurs:', validation.errors);
      return;
    }
    
    // ÉTAPE 5: Recherche utilisateur avec classe
    console.log('🔍 ÉTAPE 5: Recherche utilisateur');
    const user = await User.findOne({ matricule: cardData.matricule }).populate('classId');
    
    if (!user) {
      console.log('❌ Aucun utilisateur trouvé');
      return;
    }
    
    console.log('✅ Utilisateur trouvé:', user.firstName, user.lastName);
    
    // ÉTAPE 6: Vérification du nom
    console.log('🔍 ÉTAPE 6: Vérification du nom');
    const fullName = `${user.firstName} ${user.lastName}`.toUpperCase();
    const cardName = cardData.name.toUpperCase();
    const nameMatches = fullName === cardName;
    
    console.log('   - Nom attendu:', fullName);
    console.log('   - Nom de la carte:', cardName);
    console.log('   - Correspondance:', nameMatches ? 'OK' : 'KO');
    
    if (!nameMatches) {
      console.log('❌ Les noms ne correspondent pas');
      return;
    }
    
    // ÉTAPE 7: Génération de la réponse d'authentification
    console.log('🎯 ÉTAPE 7: Génération de la réponse');
    const authResponse = {
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
        token: 'fake-jwt-token',
        cardInfo: {
          matricule: cardData.matricule,
          name: cardData.name
        }
      }
    };
    
    console.log('\n📤 RÉPONSE D\'AUTHENTIFICATION:');
    console.log('   - Success:', authResponse.success);
    console.log('   - Utilisateur:', authResponse.data.user.name);
    console.log('   - Matricule:', authResponse.data.user.matricule);
    console.log('   - Classe:', authResponse.data.user.classId?.code || 'N/D');
    
    // ÉTAPE 8: Test de ce que le frontend recevra
    console.log('\n🖥️ ÉTAPE 8: Test frontend');
    const userData = authResponse.data.user;
    const frontendDisplay = {
      name: userData?.name || 'Utilisateur connecté',
      matricule: userData?.matricule || 'Authentification réussie',
      classId: userData?.classId?.code || 'N/D'
    };
    
    console.log('📱 Affichage dans le modal de succès:');
    console.log('   - Nom:', frontendDisplay.name);
    console.log('   - Matricule:', frontendDisplay.matricule);
    console.log('   - Classe:', frontendDisplay.classId);
    
    if (frontendDisplay.classId === 'ING4-ISI-FR') {
      console.log('\n🎉 SUCCESS COMPLET: Le modal affichera "ING4-ISI-FR" !');
    } else {
      console.log('\n❌ PROBLEM: Le modal affichera encore "N/D"');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnexion de MongoDB');
  }
};

// Exécuter le test
testFullAuthFlow();