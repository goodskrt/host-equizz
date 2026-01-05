/**
 * Script pour mettre à jour les statuts des quiz selon le nouveau mapping
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Quiz } = require('../models/Quiz');

async function updateQuizStatuses() {
    try {
        // Connexion à MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connexion à MongoDB établie');

        // Récupérer tous les quiz
        const allQuizzes = await Quiz.find({});
        console.log(`📝 ${allQuizzes.length} quiz trouvés`);

        // Répartir les quiz selon le nouveau mapping :
        // - 60% en DRAFT (à faire)
        // - 25% en ARCHIVED (en cours) 
        // - 15% en PUBLISHED (terminés)

        const updates = [];
        
        for (let i = 0; i < allQuizzes.length; i++) {
            const quiz = allQuizzes[i];
            let newStatus;
            
            if (i < Math.floor(allQuizzes.length * 0.6)) {
                newStatus = 'DRAFT'; // À faire
            } else if (i < Math.floor(allQuizzes.length * 0.85)) {
                newStatus = 'ARCHIVED'; // En cours
            } else {
                newStatus = 'PUBLISHED'; // Terminés
            }
            
            if (quiz.status !== newStatus) {
                updates.push({
                    updateOne: {
                        filter: { _id: quiz._id },
                        update: { status: newStatus }
                    }
                });
            }
        }

        if (updates.length > 0) {
            await Quiz.bulkWrite(updates);
            console.log(`✅ ${updates.length} quiz mis à jour`);
        } else {
            console.log('ℹ️ Aucune mise à jour nécessaire');
        }

        // Afficher la répartition finale
        const finalStats = await Quiz.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        console.log('\n📊 Répartition finale des statuts:');
        finalStats.forEach(stat => {
            const label = {
                'DRAFT': 'À faire',
                'ARCHIVED': 'En cours', 
                'PUBLISHED': 'Terminés'
            }[stat._id] || stat._id;
            
            console.log(`   ${label}: ${stat.count} quiz`);
        });

        console.log('\n✅ Mise à jour terminée avec succès');

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

updateQuizStatuses();