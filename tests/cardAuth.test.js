/**
 * TEST D'AUTHENTIFICATION PAR CARTE
 * 
 * Script de test pour valider le nouveau système d'authentification par carte
 * - Test de l'endpoint OCR
 * - Test de l'authentification avec image simulée
 * - Validation du processus complet
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Configuration
const BASE_URL = 'http://localhost:5000';
const TEST_IMAGE_PATH = path.join(__dirname, 'test-card.jpg');

/**
 * Création d'une image de test simulée
 */
function createTestImage() {
  // Créer une image de test simple (1x1 pixel PNG)
  const testImageBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    'base64'
  );
  
  fs.writeFileSync(TEST_IMAGE_PATH, testImageBuffer);
  console.log('✅ Image de test créée:', TEST_IMAGE_PATH);
}

/**
 * Test de l'endpoint OCR
 */
async function testOCREndpoint() {
  try {
    console.log('\n🧪 Test de l\'endpoint OCR...');
    
    const response = await fetch(`${BASE_URL}/api/ocr/test`);
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ Service OCR disponible');
      console.log('📋 Message:', result.message);
      console.log('🌍 Langues supportées:', result.supportedLanguages);
      return true;
    } else {
      console.log('❌ Service OCR non disponible:', result.message);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erreur test OCR:', error.message);
    return false;
  }
}

/**
 * Test de reconnaissance OCR avec image
 */
async function testOCRRecognition() {
  try {
    console.log('\n🔍 Test de reconnaissance OCR...');
    
    // Créer FormData avec l'image de test
    const formData = new FormData();
    formData.append('image', fs.createReadStream(TEST_IMAGE_PATH), {
      filename: 'test-card.jpg',
      contentType: 'image/jpeg'
    });
    
    const response = await fetch(`${BASE_URL}/api/ocr/recognize`, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    console.log('📥 Réponse OCR:', {
      success: result.success,
      message: result.message,
      hasData: !!result.data,
      hasErrors: !!result.errors
    });
    
    if (result.data) {
      console.log('📋 Données extraites:', result.data.cardData);
      console.log('📝 Texte brut:', result.data.rawText?.substring(0, 100) + '...');
    }
    
    if (result.errors) {
      console.log('⚠️ Erreurs:', result.errors);
    }
    
    return result.success;
    
  } catch (error) {
    console.error('❌ Erreur test reconnaissance:', error.message);
    return false;
  }
}

/**
 * Test d'authentification par carte avec image
 */
async function testCardAuthentication() {
  try {
    console.log('\n🎓 Test d\'authentification par carte...');
    
    // Créer FormData avec l'image de test
    const formData = new FormData();
    formData.append('cardImage', fs.createReadStream(TEST_IMAGE_PATH), {
      filename: 'student-card.jpg',
      contentType: 'image/jpeg'
    });
    
    const response = await fetch(`${BASE_URL}/api/auth/card-login`, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    console.log('📥 Réponse authentification:', {
      success: result.success,
      message: result.message,
      hasUserData: !!result.data?.user,
      hasToken: !!result.data?.token,
      error: result.error
    });
    
    if (result.success && result.data) {
      console.log('✅ Authentification réussie');
      console.log('👤 Utilisateur:', result.data.user.name);
      console.log('📧 Email:', result.data.user.email);
      console.log('🎯 Matricule:', result.data.user.matricule);
      console.log('🔑 Token présent:', !!result.data.token);
    } else {
      console.log('❌ Authentification échouée:', result.error);
      
      if (result.extractedData) {
        console.log('📋 Données extraites:', result.extractedData);
      }
    }
    
    return result.success;
    
  } catch (error) {
    console.error('❌ Erreur test authentification:', error.message);
    return false;
  }
}

/**
 * Test avec une vraie image de carte (si disponible)
 */
async function testWithRealCard() {
  const realCardPath = path.join(__dirname, 'real-card.jpg');
  
  if (!fs.existsSync(realCardPath)) {
    console.log('\n⚠️ Aucune vraie carte de test trouvée (real-card.jpg)');
    console.log('💡 Placez une image de carte étudiant dans:', realCardPath);
    return false;
  }
  
  try {
    console.log('\n🎓 Test avec vraie carte étudiant...');
    
    const formData = new FormData();
    formData.append('cardImage', fs.createReadStream(realCardPath), {
      filename: 'real-card.jpg',
      contentType: 'image/jpeg'
    });
    
    const response = await fetch(`${BASE_URL}/api/auth/card-login`, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    console.log('📥 Résultat avec vraie carte:');
    console.log('✅ Succès:', result.success);
    console.log('📝 Message:', result.message);
    
    if (result.success) {
      console.log('👤 Utilisateur authentifié:', result.data.user.name);
    } else {
      console.log('❌ Erreur:', result.error);
      
      if (result.extractedData) {
        console.log('📋 Matricule extrait:', result.extractedData.matricule);
        console.log('📋 Nom extrait:', result.extractedData.name);
      }
      
      if (result.rawText) {
        console.log('📝 Texte OCR (100 premiers caractères):');
        console.log(result.rawText.substring(0, 100));
      }
    }
    
    return result.success;
    
  } catch (error) {
    console.error('❌ Erreur test vraie carte:', error.message);
    return false;
  }
}

/**
 * Nettoyage des fichiers de test
 */
function cleanup() {
  try {
    if (fs.existsSync(TEST_IMAGE_PATH)) {
      fs.unlinkSync(TEST_IMAGE_PATH);
      console.log('🧹 Fichier de test supprimé');
    }
  } catch (error) {
    console.error('⚠️ Erreur nettoyage:', error.message);
  }
}

/**
 * Fonction principale de test
 */
async function runTests() {
  console.log('🚀 === TESTS D\'AUTHENTIFICATION PAR CARTE ===\n');
  
  let allTestsPassed = true;
  
  try {
    // Créer l'image de test
    createTestImage();
    
    // Test 1: Endpoint OCR
    const ocrAvailable = await testOCREndpoint();
    if (!ocrAvailable) {
      console.log('❌ Service OCR non disponible - arrêt des tests');
      return;
    }
    
    // Test 2: Reconnaissance OCR
    const ocrWorking = await testOCRRecognition();
    if (!ocrWorking) {
      allTestsPassed = false;
    }
    
    // Test 3: Authentification par carte
    const authWorking = await testCardAuthentication();
    if (!authWorking) {
      allTestsPassed = false;
    }
    
    // Test 4: Test avec vraie carte (optionnel)
    await testWithRealCard();
    
    // Résumé
    console.log('\n' + '='.repeat(50));
    if (allTestsPassed) {
      console.log('✅ TOUS LES TESTS DE BASE SONT PASSÉS');
      console.log('💡 Le système d\'authentification par carte est opérationnel');
    } else {
      console.log('⚠️ CERTAINS TESTS ONT ÉCHOUÉ');
      console.log('💡 Vérifiez les logs ci-dessus pour plus de détails');
    }
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  } finally {
    // Nettoyage
    cleanup();
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runTests();
}

module.exports = {
  testOCREndpoint,
  testOCRRecognition,
  testCardAuthentication,
  testWithRealCard
};