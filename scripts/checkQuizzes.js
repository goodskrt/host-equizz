/**
 * Script pour vérifier les quiz dans la base de données
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Quiz } = require('../models/Quiz');

async function checkQuizzes() {
    try {
        // Connexion à MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connexion à MongoDB établie');

        // Vérifier les quiz
        console.log('📝 Vérification des quiz...\n');

        const quizzes = await Quiz.find({});
        console.log(`📊 Total: ${quizzes.length} quiz trouvés\n`);

        if (quizzes.length === 0) {
            console.log('⚠️ Aucun quiz trouvé dans la base de données');
            console.log('💡 Suggestion: Exécuter le script de peuplement des données');
        } else {
            console.log('📝 Détails des quiz:');
            console.log('============================');
            
            quizzes.forEach((quiz, index) => {
                console.log(`📝 Titre: ${quiz.title}`);
                console.log(`🏫 Classe: ${quiz.classId}`);
                console.log(`📊 Statut: ${quiz.status}`);
                console.log(`📅 Début: ${quiz.startDate}`);
                console.log(`📅 Fin: ${quiz.endDate}`);
                console.log(`❓ Questions: ${quiz.questions?.length || 0}`);
                console.log('---');
            });
        }

        console.log('\n✅ Vérification terminée');

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

checkQuizzes();