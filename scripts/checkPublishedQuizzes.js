/**
 * SCRIPT: checkPublishedQuizzes.js
 * 
 * Vérifie les quiz PUBLISHED dans la base de données
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Modèles
const { Quiz } = require('../models/Quiz');

async function checkPublishedQuizzes() {
    try {
        // Connexion à MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connecté à MongoDB');

        // Récupérer tous les quiz PUBLISHED
        const publishedQuizzes = await Quiz.find({ status: 'PUBLISHED' });
        console.log(`📚 Quiz PUBLISHED trouvés: ${publishedQuizzes.length}`);

        console.log('\n📊 LISTE DES QUIZ PUBLISHED:');
        console.log('='.repeat(50));

        publishedQuizzes.forEach((quiz, index) => {
            console.log(`${index + 1}. ${quiz.title}`);
            console.log(`   - ID: ${quiz._id}`);
            console.log(`   - Type: ${quiz.type}`);
            console.log(`   - Status: ${quiz.status}`);
            console.log(`   - Questions: ${quiz.questions.length}`);
            console.log(`   - Deadline: ${quiz.deadline || 'Aucune'}`);
            console.log(`   - Créé: ${quiz.createdAt}`);
            console.log('');
        });

        // Simulation de la réponse API mobile
        console.log('🔄 SIMULATION API MOBILE:');
        console.log('='.repeat(40));
        
        const mobileResponse = {
            success: true,
            data: publishedQuizzes.map(quiz => ({
                _id: quiz._id,
                title: quiz.title,
                courseId: quiz.courseId,
                status: quiz.status, // PUBLISHED
                studentStatus: 'pending', // À faire par défaut (pas de vérification de soumission)
                deadline: quiz.deadline,
                questions: quiz.questions,
                createdAt: quiz.createdAt,
                updatedAt: quiz.updatedAt
            }))
        };

        console.log(`📱 Réponse API simulée: ${mobileResponse.data.length} quiz`);
        console.log(`   - Tous sont "À faire" (status: pending)`);
        console.log(`   - Statut backend: PUBLISHED`);

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Déconnecté de MongoDB');
    }
}

// Exécuter le script
if (require.main === module) {
    checkPublishedQuizzes();
}

module.exports = checkPublishedQuizzes;