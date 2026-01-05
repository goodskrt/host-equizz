/**
 * SCRIPT: createExpiredQuizzes.js
 * 
 * Crée des quiz expirés en modifiant les deadlines de certains quiz
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Modèles
const { Quiz } = require('../models/Quiz');

async function createExpiredQuizzes() {
    try {
        // Connexion à MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connecté à MongoDB');

        // Récupérer tous les quiz PUBLISHED
        const publishedQuizzes = await Quiz.find({ status: 'PUBLISHED' });
        console.log(`📚 Quiz PUBLISHED trouvés: ${publishedQuizzes.length}`);

        // Sélectionner environ 30% des quiz pour les faire expirer
        const quizzesToExpire = publishedQuizzes.slice(0, Math.ceil(publishedQuizzes.length * 0.3));
        console.log(`⏰ Quiz à faire expirer: ${quizzesToExpire.length}`);

        let expiredCount = 0;

        for (const quiz of quizzesToExpire) {
            // Définir une deadline dans le passé (entre 1 et 7 jours)
            const daysAgo = Math.floor(Math.random() * 7) + 1;
            const expiredDate = new Date();
            expiredDate.setDate(expiredDate.getDate() - daysAgo);

            // Mettre à jour la deadline
            await Quiz.updateOne(
                { _id: quiz._id },
                { deadline: expiredDate }
            );

            expiredCount++;
            console.log(`⏰ Quiz expiré: ${quiz.title} (deadline: ${expiredDate.toLocaleDateString()})`);
        }

        console.log('\n📊 RÉSUMÉ:');
        console.log('='.repeat(30));
        console.log(`📚 Quiz total: ${publishedQuizzes.length}`);
        console.log(`⏰ Quiz expirés: ${expiredCount}`);
        console.log(`⏳ Quiz actifs: ${publishedQuizzes.length - expiredCount}`);

        // Vérifier le résultat final
        const now = new Date();
        const allQuizzes = await Quiz.find({ status: 'PUBLISHED' });
        
        console.log('\n🎯 ÉTAT FINAL DES QUIZ:');
        console.log('='.repeat(40));
        
        let activeCount = 0;
        let expiredFinalCount = 0;
        
        for (const quiz of allQuizzes) {
            const isExpired = quiz.deadline && now > new Date(quiz.deadline);
            
            if (isExpired) {
                console.log(`⏰ EXPIRÉ | ${quiz.title} (${new Date(quiz.deadline).toLocaleDateString()})`);
                expiredFinalCount++;
            } else {
                console.log(`⏳ ACTIF  | ${quiz.title} (${quiz.deadline ? new Date(quiz.deadline).toLocaleDateString() : 'Pas de deadline'})`);
                activeCount++;
            }
        }

        console.log('\n📈 STATISTIQUES FINALES:');
        console.log('='.repeat(30));
        console.log(`📚 Total: ${allQuizzes.length}`);
        console.log(`⏳ Actifs: ${activeCount}`);
        console.log(`⏰ Expirés: ${expiredFinalCount}`);

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Déconnecté de MongoDB');
    }
}

// Exécuter le script
if (require.main === module) {
    createExpiredQuizzes();
}

module.exports = createExpiredQuizzes;