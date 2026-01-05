/**
 * SCRIPT: setQuizzesToPublished.js
 * 
 * Met tous les quiz en statut PUBLISHED pour l'app mobile
 * Seuls les quiz PUBLISHED sont pertinents pour l'app mobile
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Modèles
const { Quiz } = require('../models/Quiz');

async function setQuizzesToPublished() {
    try {
        // Connexion à MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connecté à MongoDB');

        // Mettre tous les quiz en statut PUBLISHED
        const result = await Quiz.updateMany(
            {}, // Tous les quiz
            { status: 'PUBLISHED' }
        );

        console.log(`✅ ${result.modifiedCount} quiz mis à jour en statut PUBLISHED`);

        // Vérifier le résultat
        const publishedQuizzes = await Quiz.find({ status: 'PUBLISHED' });
        console.log(`📊 Total des quiz PUBLISHED: ${publishedQuizzes.length}`);

        publishedQuizzes.forEach(quiz => {
            console.log(`  - ${quiz.title}`);
        });

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Déconnecté de MongoDB');
    }
}

// Exécuter le script
if (require.main === module) {
    setQuizzesToPublished();
}

module.exports = setQuizzesToPublished;