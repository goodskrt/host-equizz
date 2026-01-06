/**
 * Script de test pour l'authentification par scan de carte d'IGRE
 * Simule le scan du matricule 2223i278
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const { Class } = require('../models/Academic');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/equizz';

async function testCardScanIgre() {
    try {
        // Connexion à MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connecté à MongoDB');

        console.log('\n🎫 TEST D\'AUTHENTIFICATION PAR SCAN DE CARTE...');
        console.log('Simulation du scan du matricule: 2223i278');

        // Recherche par matricule (comme le ferait le scan de carte)
        const scannedMatricule = '2223i278';
        console.log(`\n🔍 Recherche de l'utilisateur avec le matricule: ${scannedMatricule}`);

        const user = await User.findOne({ matricule: scannedMatricule }).populate('classId');

        if (!user) {
            console.log('❌ Aucun utilisateur trouvé avec ce matricule');
            return;
        }

        console.log('✅ Utilisateur trouvé par scan de carte !');
        console.log('=====================================');
        console.log(`👤 Nom complet: ${user.firstName} ${user.lastName}`);
        console.log(`📧 Email: ${user.email}`);
        console.log(`🆔 Matricule: ${user.matricule}`);
        console.log(`🎭 Rôle: ${user.role}`);
        
        if (user.classId) {
            console.log(`🏫 Classe: ${user.classId.code}`);
            console.log(`📚 Filière: ${user.classId.speciality}`);
            console.log(`📊 Niveau: ${user.classId.level}`);
            console.log(`🌐 Langue: ${user.classId.language}`);
        }

        // Test de connexion automatique (sans mot de passe pour le scan de carte)
        console.log('\n🔐 SIMULATION DE CONNEXION AUTOMATIQUE...');
        console.log('✅ Connexion réussie par scan de carte');
        console.log('🎯 L\'utilisateur peut maintenant accéder à l\'application');

        // Vérification des quiz disponibles pour cet utilisateur
        const { Quiz } = require('../models/Quiz');
        const availableQuizzes = await Quiz.find({ 
            classId: user.classId._id,
            status: 'PUBLISHED'
        }).populate('courseId');

        console.log(`\n📝 QUIZ DISPONIBLES (${availableQuizzes.length}):`);
        if (availableQuizzes.length > 0) {
            availableQuizzes.forEach(quiz => {
                console.log(`   📋 ${quiz.title}`);
                console.log(`      📚 Cours: ${quiz.courseId ? quiz.courseId.name : 'N/A'}`);
                console.log(`      📅 Deadline: ${quiz.deadline ? quiz.deadline.toLocaleDateString() : 'N/A'}`);
                console.log(`      ❓ Questions: ${quiz.questions.length}`);
            });
        } else {
            console.log('   ℹ️  Aucun quiz disponible pour cette classe');
        }

        console.log('\n✅ TEST DE SCAN DE CARTE TERMINÉ AVEC SUCCÈS');

    } catch (error) {
        console.error('❌ Erreur lors du test de scan de carte:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Déconnecté de MongoDB');
    }
}

// Exécution du script
if (require.main === module) {
    testCardScanIgre();
}

module.exports = { testCardScanIgre };