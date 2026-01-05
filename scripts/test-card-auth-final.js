/**
 * Script de test pour l'authentification par carte avec les nouvelles données
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const { Class } = require('../models/Academic');
require('dotenv').config();

const testCardAuth = async () => {
  try {
    // Connexion à la base de données
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connexion à MongoDB réussie');

    // Test 1: Vérifier que l'utilisateur existe avec la classe
    console.log('\n🧪 Test 1: Vérification de l\'utilisateur et de sa classe');
    const user = await User.findOne({ matricule: '2223i278' }).populate('classId');
    
    if (!user) {
      console.error('❌ Utilisateur non trouvé');
      return;
    }
    
    console.log('✅ Utilisateur trouvé:');
    console.log('   - Matricule:', user.matricule);
    console.log('   - Nom:', `${user.firstName} ${user.lastName}`);
    console.log('   - Email:', user.email);
    console.log('   - Classe:', user.classId?.code || 'Non définie');
    
    if (user.classId) {
      console.log('   - Spécialité:', user.classId.speciality);
      console.log('   - Niveau:', user.classId.level);
      console.log('   - Langue:', user.classId.language);
    }

    // Test 2: Simuler l'extraction OCR
    console.log('\n🧪 Test 2: Simulation de l\'extraction OCR');
    const ocrText = `
      INSTITUT SAINT JEAN
      CARTE D'ETUDIANT
      
      Matricule: 2223i278
      Nom(s): IGRE URBAIN LEPONTIFE
      Né(e) le - 2 avril 2005
      À DOUALA
      FILIÈRE: Ingénierie
      Spécialité: ISI
      Niveau: ING4
    `;
    
    console.log('📝 Texte OCR simulé:');
    console.log(ocrText);

    // Test 3: Extraction des données avec les patterns
    console.log('\n🧪 Test 3: Extraction des données');
    
    // Pattern matricule
    const matriculeMatch = ocrText.match(/(?:Matricule\s*:?\s*)?(\d{4}[a-zA-Z]\d{3})/i);
    const extractedMatricule = matriculeMatch ? matriculeMatch[1].toLowerCase() : null;
    
    // Pattern nom (s'arrête avant "Né(e)")
    const nomMatch = ocrText.match(/Nom\s*\(s\)\s*:?\s*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s]+?)(?:\s+Né\(e\)|$)/i);
    const extractedName = nomMatch ? nomMatch[1].trim().toUpperCase() : null;
    
    console.log('🎯 Données extraites:');
    console.log('   - Matricule:', extractedMatricule);
    console.log('   - Nom:', extractedName);

    // Test 4: Vérification de correspondance
    console.log('\n🧪 Test 4: Vérification de correspondance');
    
    const matriculeMatch_result = extractedMatricule === user.matricule;
    const fullName = `${user.firstName} ${user.lastName}`.toUpperCase();
    const nameMatch_result = extractedName === fullName;
    
    console.log('✅ Correspondances:');
    console.log('   - Matricule:', matriculeMatch_result ? '✅ OK' : '❌ KO');
    console.log('     Attendu:', user.matricule);
    console.log('     Extrait:', extractedMatricule);
    console.log('   - Nom:', nameMatch_result ? '✅ OK' : '❌ KO');
    console.log('     Attendu:', fullName);
    console.log('     Extrait:', extractedName);

    // Test 5: Résultat final
    console.log('\n🎯 Résultat final:');
    if (matriculeMatch_result && nameMatch_result) {
      console.log('✅ AUTHENTIFICATION RÉUSSIE !');
      console.log('   - Utilisateur:', user.firstName + ' ' + user.lastName);
      console.log('   - Matricule:', user.matricule);
      console.log('   - Classe:', user.classId?.code || 'N/D');
      console.log('   - Email:', user.email);
    } else {
      console.log('❌ AUTHENTIFICATION ÉCHOUÉE');
      console.log('   - Problème de correspondance des données');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnexion de MongoDB');
  }
};

// Exécuter le test
testCardAuth();