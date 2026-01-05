/**
 * Script de test pour vérifier la logique de soumission réelle
 * Teste l'endpoint /api/student/submissions et la logique de mapping des statuts
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const { Quiz } = require('../models/Quiz');
const { SubmissionLog } = require('../models/Submission');

// Configuration de la base de données
require('dotenv').config();
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/equizz';

async function testSubmissionLogic() {
    try {
        console.log('🔗 Connexion à MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connecté à MongoDB');

        // 1. Trouver l'étudiant de test (2223i278)
        const student = await User.findOne({ studentId: '2223i278' });
        if (!student) {
            console.error('❌ Étudiant 2223i278 non trouvé');
            return;
        }
        console.log('👤 Étudiant trouvé:', student.firstName, student.lastName);

        // 2. Récupérer tous les quiz PUBLISHED
        const publishedQuizzes = await Quiz.find({ status: 'PUBLISHED' })
            .populate('courseId')
            .sort({ createdAt: -1 });
        
        console.log('📝 Quiz PUBLISHED trouvés:', publishedQuizzes.length);

        // 3. Récupérer les soumissions de l'étudiant
        const submissions = await SubmissionLog.find({ studentId: student._id });
        const submittedQuizIds = submissions.map(sub => sub.quizId.toString());
        
        console.log('📋 Soumissions de l\'étudiant:', submissions.length);
        console.log('📋 Quiz soumis:', submittedQuizIds);

        // 4. Appliquer la logique de mapping des statuts
        console.log('\n🔍 ANALYSE DES STATUTS:');
        console.log('='.repeat(50));
        
        const now = new Date();
        let pendingCount = 0;
        let completedCount = 0;
        let expiredCount = 0;

        publishedQuizzes.forEach(quiz => {
            const isSubmitted = submittedQuizIds.includes(quiz._id.toString());
            const isExpired = quiz.deadline && now > new Date(quiz.deadline);
            
            let finalStatus;
            if (isExpired) {
                finalStatus = 'EXPIRÉ';
                expiredCount++;
            } else if (isSubmitted) {
                finalStatus = 'TERMINÉ';
                completedCount++;
            } else {
                finalStatus = 'À FAIRE';
                pendingCount++;
            }
            
            console.log(`📌 ${quiz.title}`);
            console.log(`   Course: ${quiz.courseId?.name || 'N/A'}`);
            console.log(`   Deadline: ${quiz.deadline ? new Date(quiz.deadline).toLocaleString() : 'Aucune'}`);
            console.log(`   Soumis: ${isSubmitted ? 'OUI' : 'NON'}`);
            console.log(`   Expiré: ${isExpired ? 'OUI' : 'NON'}`);
            console.log(`   → STATUT FINAL: ${finalStatus}`);
            console.log('');
        });

        // 5. Résumé des statistiques
        console.log('📊 STATISTIQUES FINALES:');
        console.log('='.repeat(30));
        console.log(`📝 Total des quiz: ${publishedQuizzes.length}`);
        console.log(`⏳ À faire: ${pendingCount}`);
        console.log(`✅ Terminés: ${completedCount}`);
        console.log(`❌ Expirés: ${expiredCount}`);
        console.log(`📋 Soumissions: ${submissions.length}`);

        // 6. Vérifier la cohérence
        const totalCalculated = pendingCount + completedCount + expiredCount;
        if (totalCalculated === publishedQuizzes.length) {
            console.log('✅ Cohérence des données vérifiée');
        } else {
            console.log('❌ Incohérence détectée:', totalCalculated, 'vs', publishedQuizzes.length);
        }

        // 7. Simuler la réponse API
        console.log('\n🌐 SIMULATION RÉPONSE API /student/submissions:');
        console.log('='.repeat(50));
        const apiResponse = submissions.map(sub => ({
            quizId: sub.quizId.toString(),
            submittedAt: sub.submittedAt
        }));
        console.log(JSON.stringify(apiResponse, null, 2));

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Déconnecté de MongoDB');
    }
}

// Exécuter le test
testSubmissionLogic();