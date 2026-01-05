/**
 * SCRIPT DE TEST: Interface de Quiz
 * 
 * Description: Test de l'interface de prise de quiz avec données réelles
 * Utilisation: node scripts/testQuizInterface.js
 */

const mongoose = require('mongoose');
const { Quiz } = require('../models/Quiz');
const { SubmissionLog } = require('../models/Submission');
const User = require('../models/User');
const { Course } = require('../models/Academic');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGO_URI || 'mongodb+srv://iulp562_db_user:Igreurbain562@cluster0.imuet5k.mongodb.net/?appName=Cluster0';

async function testQuizInterface() {
    try {
        // Connexion à MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connexion à MongoDB réussie');

        // 1. Récupérer un quiz de test
        const quiz = await Quiz.findOne({ status: 'PUBLISHED' })
            .populate('courseId');
        
        if (!quiz) {
            console.log('❌ Aucun quiz publié trouvé');
            return;
        }

        console.log('\n📋 QUIZ DE TEST:');
        console.log(`- ID: ${quiz._id}`);
        console.log(`- Titre: ${quiz.title}`);
        console.log(`- Cours: ${quiz.courseId?.name || 'N/A'}`);
        console.log(`- Type: ${quiz.type}`);
        console.log(`- Questions: ${quiz.questions.length}`);
        console.log(`- Deadline: ${quiz.deadline || 'Aucune'}`);

        // 2. Afficher les questions
        console.log('\n❓ QUESTIONS:');
        quiz.questions.forEach((q, index) => {
            console.log(`${index + 1}. ${q.textSnapshot}`);
            console.log(`   Type: ${q.qType}`);
            if (q.optionsSnapshot && q.optionsSnapshot.length > 0) {
                console.log(`   Options: ${q.optionsSnapshot.join(', ')}`);
            }
            console.log('');
        });

        // 3. Simuler une soumission
        const student = await User.findOne({ role: 'STUDENT' });
        if (!student) {
            console.log('❌ Aucun étudiant trouvé');
            
            // Vérifier tous les utilisateurs
            const allUsers = await User.find({});
            console.log(`📊 Total utilisateurs: ${allUsers.length}`);
            allUsers.forEach(u => {
                console.log(`- ${u.name} (${u.matricule}) - Role: ${u.role}`);
            });
            return;
        }

        console.log(`👤 ÉTUDIANT DE TEST: ${student.name} (${student.matricule})`);

        // Vérifier si déjà soumis
        const existingSubmission = await SubmissionLog.findOne({
            studentId: student._id,
            quizId: quiz._id
        });

        if (existingSubmission) {
            console.log('✅ Quiz déjà soumis par cet étudiant');
            console.log(`   Date de soumission: ${existingSubmission.submittedAt}`);
        } else {
            console.log('⏳ Quiz pas encore soumis - prêt pour la prise');
        }

        // 4. Simuler des réponses
        console.log('\n🎯 SIMULATION DE RÉPONSES:');
        const simulatedAnswers = quiz.questions.map(q => {
            let answer;
            if (q.qType === 'MCQ' && q.optionsSnapshot && q.optionsSnapshot.length > 0) {
                // Choisir une option aléatoire
                answer = q.optionsSnapshot[Math.floor(Math.random() * q.optionsSnapshot.length)];
            } else {
                // Réponse ouverte
                answer = `Réponse simulée pour la question: ${q.textSnapshot.substring(0, 50)}...`;
            }
            
            console.log(`- Question ${q.questionId}: ${answer}`);
            return {
                questionId: q.questionId,
                value: answer,
                type: q.qType
            };
        });

        console.log('\n✅ Test de l\'interface de quiz terminé avec succès');
        console.log('\n📱 PROCHAINES ÉTAPES:');
        console.log('1. Ouvrir l\'app mobile');
        console.log(`2. Naviguer vers le quiz ID: ${quiz._id}`);
        console.log('3. Répondre aux questions');
        console.log('4. Soumettre le quiz');

    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Déconnexion de MongoDB');
    }
}

// Exécution du script
if (require.main === module) {
    testQuizInterface();
}

module.exports = { testQuizInterface };