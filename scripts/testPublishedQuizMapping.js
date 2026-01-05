/**
 * SCRIPT: testPublishedQuizMapping.js
 * 
 * Teste le nouveau mapping avec les quiz PUBLISHED et les soumissions
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Modèles
const { Quiz } = require('../models/Quiz');
const User = require('../models/User');
const { SubmissionLog } = require('../models/Submission');

async function testPublishedQuizMapping() {
    try {
        // Connexion à MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connecté à MongoDB');

        // Récupérer un étudiant de test
        const student = await User.findOne({ role: 'student' });
        if (!student) {
            console.log('❌ Aucun étudiant trouvé');
            return;
        }

        console.log(`👤 Étudiant de test: ${student.name} (${student.matricule})`);

        // Récupérer tous les quiz PUBLISHED
        const publishedQuizzes = await Quiz.find({ status: 'PUBLISHED' }).populate('courseId');
        console.log(`📚 Quiz PUBLISHED trouvés: ${publishedQuizzes.length}`);

        // Vérifier les soumissions pour cet étudiant
        const submissions = await SubmissionLog.find({ studentId: student._id });
        console.log(`📝 Soumissions de l'étudiant: ${submissions.length}`);

        console.log('\n📊 MAPPING DES QUIZ:');
        console.log('='.repeat(50));

        for (const quiz of publishedQuizzes) {
            const hasSubmission = submissions.some(sub => sub.quizId.toString() === quiz._id.toString());
            const status = hasSubmission ? '✅ TERMINÉ' : '⏳ À FAIRE';
            
            console.log(`${status} | ${quiz.title} (${quiz.courseId?.code || 'N/A'})`);
        }

        // Statistiques
        const todoQuizzes = publishedQuizzes.filter(quiz => 
            !submissions.some(sub => sub.quizId.toString() === quiz._id.toString())
        );
        const completedQuizzes = publishedQuizzes.filter(quiz => 
            submissions.some(sub => sub.quizId.toString() === quiz._id.toString())
        );

        console.log('\n📈 STATISTIQUES:');
        console.log('='.repeat(30));
        console.log(`📚 Total quiz PUBLISHED: ${publishedQuizzes.length}`);
        console.log(`⏳ À faire: ${todoQuizzes.length}`);
        console.log(`✅ Terminés: ${completedQuizzes.length}`);

        // Simulation de l'API mobile
        console.log('\n🔄 SIMULATION API MOBILE:');
        console.log('='.repeat(40));
        
        const mobileResponse = {
            success: true,
            data: publishedQuizzes.map(quiz => {
                const hasSubmission = submissions.some(sub => sub.quizId.toString() === quiz._id.toString());
                return {
                    _id: quiz._id,
                    title: quiz.title,
                    courseId: quiz.courseId,
                    status: quiz.status, // PUBLISHED
                    studentStatus: hasSubmission ? 'completed' : 'pending',
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

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Déconnecté de MongoDB');
    }
}

// Exécuter le script
if (require.main === module) {
    testPublishedQuizMapping();
}

module.exports = testPublishedQuizMapping;