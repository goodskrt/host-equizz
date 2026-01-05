/**
 * Script pour créer un utilisateur de test pour l'authentification par carte
 * avec la classe ING4-ISI-FR
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const { Class, AcademicYear } = require('../models/Academic');
require('dotenv').config();

const createTestUser = async () => {
  try {
    // Connexion à la base de données
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connexion à MongoDB réussie');

    // 1. Créer ou récupérer l'année académique courante
    let currentYear = await AcademicYear.findOne({ isCurrent: true });
    if (!currentYear) {
      currentYear = new AcademicYear({
        label: '2024-2025',
        isCurrent: true
      });
      await currentYear.save();
      console.log('✅ Année académique créée:', currentYear.label);
    } else {
      console.log('ℹ️ Année académique existante:', currentYear.label);
    }

    // 2. Créer ou récupérer la classe ING4-ISI-FR
    let testClass = await Class.findOne({ code: 'ING4-ISI-FR' });
    if (!testClass) {
      testClass = new Class({
        code: 'ING4-ISI-FR',
        speciality: 'ISI', // Ingénierie des Systèmes d'Information
        level: 4,
        language: 'FR',
        academicYear: currentYear._id
      });
      await testClass.save();
      console.log('✅ Classe créée:', testClass.code);
    } else {
      console.log('ℹ️ Classe existante:', testClass.code);
    }

    // 3. Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ matricule: '2223i278' });
    
    if (existingUser) {
      console.log('ℹ️ L\'utilisateur de test existe déjà:', existingUser.email);
      console.log('   - Matricule:', existingUser.matricule);
      console.log('   - Nom:', `${existingUser.firstName} ${existingUser.lastName}`);
      console.log('   - Email:', existingUser.email);
      console.log('   - Rôle:', existingUser.role);
      
      // Mettre à jour la classe si nécessaire
      if (!existingUser.classId || existingUser.classId.toString() !== testClass._id.toString()) {
        existingUser.classId = testClass._id;
        await existingUser.save();
        console.log('✅ Classe mise à jour pour l\'utilisateur existant');
      }
      
      // Afficher les informations avec la classe
      const userWithClass = await User.findById(existingUser._id).populate('classId');
      console.log('   - Classe:', userWithClass.classId?.code || 'Non définie');
      return;
    }

    // 4. Créer l'utilisateur de test
    const testUser = new User({
      matricule: '2223i278',
      email: 'igre.urbain@institutsaintjean.org',
      password: 'password123', // Sera hashé automatiquement
      firstName: 'IGRE',
      lastName: 'URBAIN LEPONTIFE',
      role: 'STUDENT',
      classId: testClass._id
    });

    await testUser.save();
    
    console.log('✅ Utilisateur de test créé avec succès !');
    console.log('   - Matricule:', testUser.matricule);
    console.log('   - Nom:', `${testUser.firstName} ${testUser.lastName}`);
    console.log('   - Email:', testUser.email);
    console.log('   - Rôle:', testUser.role);
    console.log('   - Classe:', testClass.code);
    console.log('   - Mot de passe:', 'password123');
    
    console.log('\n🎯 Données pour le test d\'authentification par carte:');
    console.log('   - Matricule: 2223i278');
    console.log('   - Nom complet: IGRE URBAIN LEPONTIFE');
    console.log('   - Classe: ING4-ISI-FR');
    console.log('   - Niveau: 4');
    console.log('   - Spécialité: ISI');
    console.log('   - Langue: FR');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur de test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnexion de MongoDB');
  }
};

// Exécuter le script
createTestUser();