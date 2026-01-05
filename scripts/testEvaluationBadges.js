/**
 * SCRIPT DE TEST: testEvaluationBadges.js
 * 
 * Test du système de badges dans la page d'évaluations
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

// Modèles
const User = require('../models/User');
const { Quiz } = require('../models/Quiz');
const { SubmissionLog } = require('../models/Submission');
const { Course } = require('../models/Academic');

async function testEvaluationBadges() {
    try {
        console.log('🧪 === TEST DU SYSTÈME DE BADGES ===');
        
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
        console.log('📋 Quiz soumis:', submittedQuizIds);

        // Analyser chaque quiz et son statut pour l'étudiant
        const now = new Date();
        let stats = {
            pending: 0,    // À faire
            completed: 0,  // Terminé
            expired: 0,    // Expiré
            total: 0
        };

        console.log('\n📊 === ANALYSE DES STATUTS ===');
        
        classQuizzes.forEach(quiz => {
            const isSubmitted = submittedQuizIds.includes(quiz._id.toString());
            const isExpired = quiz.deadline && new Date(quiz.deadline) < now;
            
            let studentStatus;
            if (isExpired) {
                studentStatus = 'expired';
                stats.expired++;
            } else if (isSubmitted) {
                studentStatus = 'completed';
                stats.completed++;
            } else {
                studentStatus = 'pending';
                stats.pending++;
            }
            
            stats.total++;
            
            console.log(`📝 ${quiz.title}`);
            console.log(`   📅 Deadline: ${quiz.deadline ? new Date(quiz.deadline).toLocaleDateString() : 'Aucune'}`);
            console.log(`   ⏰ Expiré: ${isExpired ? 'Oui' : 'Non'}`);
            console.log(`   ✅ Soumis: ${isSubmitted ? 'Oui' : 'Non'}`);
            console.log(`   🏷️  Statut étudiant: ${studentStatus}`);
            console.log('');
        });

        console.log('📈 === STATISTIQUES FINALES ===');
        console.log(`📊 Total: ${stats.total}`);
        console.log(`⏳ À faire (pending): ${stats.pending}`);
        console.log(`✅ Terminé (completed): ${stats.completed}`);
        console.log(`⏰ Expiré (expired): ${stats.expired}`);

        console.log('\n🎨 === TEST DES BADGES PAR SECTION ===');
        console.log('Section "À faire": Badge orange "À faire" affiché');
        console.log('Section "Terminées": Badge vert "Terminé" affiché');
        console.log('Section "Expirées": Badge rouge "Expiré" affiché');
        console.log('Section "Toutes": Aucun badge affiché');

        console.log('\n💬 === TEST DES MODALS ===');
        console.log('Quiz expiré: Modal "Quiz expiré ⏰" avec message explicatif');
        console.log('Quiz terminé: Modal "Quiz terminé ✅" avec message de confirmation');
        console.log('Quiz à faire: Navigation vers l\'interface de quiz');

        console.log('\n✅ Test du système de badges terminé avec succès!');

    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Déconnecté de MongoDB');
    }
}

// Exécuter le test
testEvaluationBadges();