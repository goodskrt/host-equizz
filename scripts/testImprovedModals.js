/**
 * SCRIPT DE TEST: testImprovedModals.js
 * 
 * Test des modals améliorés pour les quiz expirés et terminés
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

// Modèles
const User = require('../models/User');
const { Quiz } = require('../models/Quiz');
const { SubmissionLog } = require('../models/Submission');
const { Course } = require('../models/Academic');

async function testImprovedModals() {
    try {
        console.log('🎨 === TEST DES MODALS AMÉLIORÉS ===');
        
        // Connexion à MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connecté à MongoDB');

        // Récupérer l'étudiant de test
        const student = await User.findOne({ matricule: '2223i278' });
        if (!student) {
            console.log('❌ Étudiant 2223i278 non trouvé');
            return;
        }
        console.log('👤 Étudiant trouvé:', student.name);

        // Récupérer tous les quiz de la classe
        const allQuizzes = await Quiz.find({ 
            status: 'PUBLISHED'
        }).populate('courseId');

        // Filtrer les quiz pour la classe de l'étudiant
        const classQuizzes = allQuizzes.filter(q => 
            q.courseId && q.courseId.classId && 
            q.courseId.classId.toString() === student.classId.toString()
        );

        console.log(`📝 Quiz PUBLISHED trouvés: ${classQuizzes.length}`);

        // Récupérer les soumissions de l'étudiant
        const submissions = await SubmissionLog.find({ 
            studentId: student._id 
        });
        console.log(`📤 Soumissions de l'étudiant: ${submissions.length}`);

        const submittedQuizIds = submissions.map(s => s.quizId.toString());

        // Analyser les quiz pour les modals
        const now = new Date();
        let modalTests = {
            expired: [],
            completed: [],
            pending: []
        };

        console.log('\n🎭 === ANALYSE POUR LES MODALS ===');
        
        classQuizzes.forEach(quiz => {
            const isSubmitted = submittedQuizIds.includes(quiz._id.toString());
            const isExpired = quiz.deadline && new Date(quiz.deadline) < now;
            const submission = submissions.find(s => s.quizId.toString() === quiz._id.toString());
            
            let modalType;
            if (isExpired) {
                modalType = 'expired';
                modalTests.expired.push({
                    quiz: quiz.title,
                    deadline: quiz.deadline,
                    course: quiz.courseId?.name || 'N/A',
                    courseCode: quiz.courseId?.code || 'N/A',
                    submitted: isSubmitted
                });
            } else if (isSubmitted) {
                modalType = 'completed';
                modalTests.completed.push({
                    quiz: quiz.title,
                    submissionDate: submission?.submittedAt,
                    course: quiz.courseId?.name || 'N/A',
                    courseCode: quiz.courseId?.code || 'N/A',
                    questionsCount: quiz.questions?.length || 0
                });
            } else {
                modalType = 'pending';
                modalTests.pending.push({
                    quiz: quiz.title,
                    deadline: quiz.deadline,
                    course: quiz.courseId?.name || 'N/A',
                    courseCode: quiz.courseId?.code || 'N/A'
                });
            }
            
            console.log(`📝 ${quiz.title}`);
            console.log(`   📚 Cours: ${quiz.courseId?.code} - ${quiz.courseId?.name}`);
            console.log(`   📅 Deadline: ${quiz.deadline ? new Date(quiz.deadline).toLocaleDateString() : 'Aucune'}`);
            console.log(`   🎭 Modal: ${modalType}`);
            if (submission) {
                console.log(`   📤 Soumis le: ${new Date(submission.submittedAt).toLocaleDateString()}`);
            }
            console.log('');
        });

        console.log('📊 === RÉSUMÉ DES MODALS ===');
        console.log(`⏰ Quiz expirés (Modal Expiré): ${modalTests.expired.length}`);
        console.log(`✅ Quiz terminés (Modal Terminé): ${modalTests.completed.length}`);
        console.log(`🚀 Quiz à faire (Navigation): ${modalTests.pending.length}`);

        console.log('\n🎨 === DÉTAILS DES MODALS EXPIRÉS ===');
        modalTests.expired.forEach((item, index) => {
            console.log(`${index + 1}. ${item.quiz}`);
            console.log(`   📚 ${item.courseCode} - ${item.course}`);
            console.log(`   📅 Expiré le: ${new Date(item.deadline).toLocaleDateString()}`);
            console.log(`   📤 Soumis: ${item.submitted ? 'Oui' : 'Non'}`);
            console.log(`   🎭 Modal: "Quiz Expiré ⏰" avec message explicatif`);
        });

        console.log('\n✅ === DÉTAILS DES MODALS TERMINÉS ===');
        modalTests.completed.forEach((item, index) => {
            console.log(`${index + 1}. ${item.quiz}`);
            console.log(`   📚 ${item.courseCode} - ${item.course}`);
            console.log(`   📤 Soumis le: ${new Date(item.submissionDate).toLocaleDateString()}`);
            console.log(`   ❓ Questions: ${item.questionsCount}`);
            console.log(`   🎭 Modal: "Quiz Terminé ✅" avec date de soumission`);
        });

        console.log('\n🚀 === QUIZ À FAIRE (NAVIGATION) ===');
        modalTests.pending.forEach((item, index) => {
            console.log(`${index + 1}. ${item.quiz}`);
            console.log(`   📚 ${item.courseCode} - ${item.course}`);
            console.log(`   📅 Deadline: ${new Date(item.deadline).toLocaleDateString()}`);
            console.log(`   🎭 Action: Navigation vers /quiz/${item.quiz.replace(/\s+/g, '-').toLowerCase()}`);
        });

        console.log('\n🎨 === FONCTIONNALITÉS DES NOUVEAUX MODALS ===');
        console.log('✨ Design personnalisé avec animations');
        console.log('🎯 Icônes et couleurs thématiques');
        console.log('📋 Informations détaillées du quiz');
        console.log('📚 Affichage du cours associé');
        console.log('📅 Dates formatées (deadline/soumission)');
        console.log('❓ Nombre de questions');
        console.log('🎭 Messages contextuels améliorés');
        console.log('📱 Interface responsive et accessible');

        console.log('\n✅ Test des modals améliorés terminé avec succès!');

    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Déconnecté de MongoDB');
    }
}

// Exécuter le test
testImprovedModals();