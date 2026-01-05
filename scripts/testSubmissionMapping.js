/**
 * SCRIPT: testSubmissionMapping.js
 * 
 * Teste le mapping des statuts avec les soumissions pour l'étudiant 2223i278
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Modèles
const { Quiz } = require('../models/Quiz');
const User = require('../models/User');
const { SubmissionLog } = require('../models/Submission');

async function testSubmissionMapping() {
    try {
        // Connexion à MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connecté à MongoDB');

        // Trouver l'étudiant avec le matricule 2223i278
        const student = await User.findOne({ matricule: '2223i278' });
        if (!student) {
            console.log('❌ Étudiant avec matricule 2223i278 non trouvé');
            return;
        }

        console.log(`👤 Étudiant trouvé: ${student.name} (${student.matricule})`);

        // Récupérer tous les quiz PUBLISHED
        const publishedQuizzes = await Quiz.find({ status: 'PUBLISHED' });
        console.log(`📚 Quiz PUBLISHED trouvés: ${publishedQuizzes.length}`);

        // Récupérer toutes les soumissions de l'étudiant
        const submissions = await SubmissionLog.find({ studentId: student._id });
        console.log(`📝 Soumissions de l'étudiant: ${submissions.length}`);

        const submittedQuizIds = submissions.map(s => s.quizId.toString());

        console.log('\n🎯 MAPPING COMPLET DES STATUTS:');
        console.log('='.repeat(60));

        const now = new Date();
        let pendingCount = 0;
        let completedCount = 0;
        let expiredCount = 0;

        for (const quiz of publishedQuizzes) {
            const isSubmitted = submittedQuizIds.includes(quiz._id.toString());
            const isExpired = quiz.deadline && now > new Date(quiz.deadline);
            
            let status = 'pending';
            let statusLabel = '⏳ À FAIRE';
            let statusColor = '\x1b[33m'; // Jaune
            
            if (isExpired) {
                // Un quiz expiré reste expiré même s'il a été soumis
                status = 'expired';
                statusLabel = '⏰ EXPIRÉ';
                statusColor = '\x1b[31m'; // Rouge
                expiredCount++;
            } else if (isSubmitted) {
                status = 'completed';
                statusLabel = '✅ TERMINÉ';
                statusColor = '\x1b[32m'; // Vert
                completedCount++;
            } else {
                pendingCount++;
            }
            
            const courseName = quiz.courseId || 'N/A';
            const deadlineStr = quiz.deadline ? new Date(quiz.deadline).toLocaleDateString() : 'Aucune';
            
            console.log(`${statusColor}${statusLabel}\x1b[0m | ${courseName} | ${quiz.title} | Deadline: ${deadlineStr}`);
        }

        console.log('\n📊 STATISTIQUES FINALES:');
        console.log('='.repeat(40));
        console.log(`📚 Total quiz: ${publishedQuizzes.length}`);
        console.log(`⏳ À faire: ${pendingCount}`);
        console.log(`✅ Terminés: ${completedCount}`);
        console.log(`⏰ Expirés: ${expiredCount}`);

        console.log('\n🔄 SIMULATION API MOBILE:');
        console.log('='.repeat(40));
        
        const mobileResponse = {
            success: true,
            data: publishedQuizzes.map(quiz => {
                const isSubmitted = submittedQuizIds.includes(quiz._id.toString());
                const isExpired = quiz.deadline && now > new Date(quiz.deadline);
                
                let studentStatus = 'pending';
                if (isExpired) {
                    // Un quiz expiré reste expiré même s'il a été soumis
                    studentStatus = 'expired';
                } else if (isSubmitted) {
                    studentStatus = 'completed';
                }
                
                return {
                    _id: quiz._id,
                    title: quiz.title,
                    courseId: quiz.courseId,
                    status: quiz.status, // PUBLISHED
                    studentStatus: studentStatus,
                    deadline: quiz.deadline,
                    questions: quiz.questions,
                    createdAt: quiz.createdAt,
                    updatedAt: quiz.updatedAt
                };
            })
        };

        console.log(`📱 Réponse API simulée: ${mobileResponse.data.length} quiz`);
        console.log(`   - À faire: ${mobileResponse.data.filter(q => q.studentStatus === 'pending').length}`);
        console.log(`   - Terminés: ${mobileResponse.data.filter(q => q.studentStatus === 'completed').length}`);
        console.log(`   - Expirés: ${mobileResponse.data.filter(q => q.studentStatus === 'expired').length}`);

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Déconnecté de MongoDB');
    }
}

// Exécuter le script
if (require.main === module) {
    testSubmissionMapping();
}

module.exports = testSubmissionMapping;