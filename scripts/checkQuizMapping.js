/**
 * Script pour vérifier le mapping des quiz et des classes
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Quiz } = require('../models/Quiz');
const { Course, Class } = require('../models/Academic');
const User = require('../models/User');

async function checkQuizMapping() {
    try {
        // Connexion à MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connexion à MongoDB établie');

        // 1. Vérifier l'utilisateur de test
        const testUser = await User.findOne({ email: 'etudiant.test@institut.fr' }).populate('classId');
        console.log('\n👤 Utilisateur de test:');
        console.log(`   Email: ${testUser.email}`);
        console.log(`   Classe ID: ${testUser.classId._id}`);
        console.log(`   Classe Code: ${testUser.classId.code}`);

        // 2. Vérifier les cours de cette classe
        const courses = await Course.find({ classId: testUser.classId._id });
        console.log(`\n📚 Cours de la classe ${testUser.classId.code}:`);
        courses.forEach(course => {
            console.log(`   - ${course.code}: ${course.name}`);
        });

        // 3. Vérifier tous les quiz
        const allQuizzes = await Quiz.find({}).populate('courseId');
        console.log(`\n📝 Tous les quiz (${allQuizzes.length}):`);
        
        const quizzesByStatus = {};
        const quizzesByClass = {};
        
        allQuizzes.forEach(quiz => {
            // Grouper par statut
            if (!quizzesByStatus[quiz.status]) {
                quizzesByStatus[quiz.status] = [];
            }
            quizzesByStatus[quiz.status].push(quiz);
            
            // Grouper par classe
            if (quiz.courseId) {
                const classId = quiz.courseId.classId.toString();
                if (!quizzesByClass[classId]) {
                    quizzesByClass[classId] = [];
                }
                quizzesByClass[classId].push(quiz);
            }
            
            console.log(`   - ${quiz.title} (${quiz.status})`);
            console.log(`     Cours: ${quiz.courseId ? quiz.courseId.name : 'N/A'}`);
            console.log(`     Classe du cours: ${quiz.courseId ? quiz.courseId.classId : 'N/A'}`);
        });

        // 4. Statistiques par statut
        console.log('\n📊 Répartition par statut:');
        Object.keys(quizzesByStatus).forEach(status => {
            const label = {
                'DRAFT': 'À faire',
                'ARCHIVED': 'En cours', 
                'PUBLISHED': 'Terminés'
            }[status] || status;
            console.log(`   ${label}: ${quizzesByStatus[status].length} quiz`);
        });

        // 5. Quiz pour la classe de test
        const testClassId = testUser.classId._id.toString();
        const quizzesForTestClass = quizzesByClass[testClassId] || [];
        console.log(`\n🎯 Quiz pour la classe ${testUser.classId.code}:`);
        console.log(`   Total: ${quizzesForTestClass.length} quiz`);
        
        const statusBreakdown = {};
        quizzesForTestClass.forEach(quiz => {
            if (!statusBreakdown[quiz.status]) {
                statusBreakdown[quiz.status] = 0;
            }
            statusBreakdown[quiz.status]++;
        });
        
        Object.keys(statusBreakdown).forEach(status => {
            const label = {
                'DRAFT': 'À faire',
                'ARCHIVED': 'En cours', 
                'PUBLISHED': 'Terminés'
            }[status] || status;
            console.log(`   - ${label}: ${statusBreakdown[status]} quiz`);
        });

        console.log('\n✅ Vérification terminée');

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

checkQuizMapping();