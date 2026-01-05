/**
 * Script pour tester l'authentification par carte avec les données de classe
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const testCardAuthWithClass = async () => {
  try {
    console.log('🧪 Test de l\'authentification par carte avec classe...');
    
    // Simuler les données OCR extraites
    const testData = {
      matricule: '2223i278',
      name: 'IGRE URBAIN LEPONTIFE'
    };
    
    console.log('📋 Données de test:', testData);
    
    // Test de l'endpoint d'authentification par carte (simulation)
    // En réalité, cela se ferait avec une vraie image, mais on peut tester la logique
    
    const response = await axios.post('http://localhost:5000/api/auth/card-login', {
      // Simuler une requête avec les données extraites
      cardData: testData
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Réponse de l\'API:');
    console.log('📤 Status:', response.status);
    console.log('📋 Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data.user.classId) {
      console.log('\n🎯 Données de classe dans la réponse:');
      console.log('   - Code:', response.data.data.user.classId.code);
      console.log('   - Spécialité:', response.data.data.user.classId.speciality);
      console.log('   - Niveau:', response.data.data.user.classId.level);
      console.log('   - Langue:', response.data.data.user.classId.language);
      
      console.log('\n✅ SUCCESS: La classe est correctement retournée !');
    } else {
      console.log('\n❌ PROBLEM: Pas de données de classe dans la réponse');
    }
    
  } catch (error) {
    if (error.response) {
      console.error('❌ Erreur API:', error.response.status, error.response.data);
    } else {
      console.error('❌ Erreur:', error.message);
    }
  }
};

// Attendre un peu que le serveur soit prêt
setTimeout(() => {
  testCardAuthWithClass();
}, 2000);