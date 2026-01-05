/**
 * SCRIPT: addSubmissionsForStudent.js
 * 
 * Ajoute des soumissions pour l'étudiant avec matricule 2223i278
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Modèles
const { Quiz } = require('../models/Quiz');
const User = require('../models/User');
const { SubmissionLog } = require('../models/Submission');

async function addSubmissionsForStudent() {
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

        // Vérifier les soumissions existantes
        const existingSubmissions = await SubmissionLog.find({ studentId: student._id });
        console.log(`📝 Soumissions existantes: ${existingSubmissions.length}`);

        // Sélectionner quelques quiz pour créer des soumissions (environ 40% des quiz)
        const quizzesToSubmit = publishedQuizzes.slice(0, Math.ceil(publishedQuizzes.length * 0.4));
        console.log(`🎯 Quiz à soumettre: ${quizzesToSubmit.length}`);

        let submissionsCreated = 0;

        for (const quiz of quizzesToSubmit) {
            // Vérifier si une soumission existe déjà
            const existingSubmission = await SubmissionLog.findOne({
                studentId: student._id,
                quizId: quiz._id
            });

            if (existingSubmission) {
                console.log(`⏭️  Soumission déjà existante pour: ${quiz.title}`);
                continue;
            }

            // Créer une nouvelle soumission
            const submission = new SubmissionLog({
                studentId: student._id,
                quizId: quiz._id,
                submittedAt: new Date()
            });

            try {
                await submission.save();
                submissionsCreated++;
                console.log(`✅ Soumission créée pour: ${quiz.title}`);
            } catch (error) {
                if (error.code === 11000) {
                    console.log(`⚠️  Soumission déjà existante (doublon) pour: ${quiz.title}`);
                } else {
                    console.error(`❌ Erreur lors de la création de soumission pour ${quiz.title}:`, error.message);
                }
            }
        }

        console.log('\n📊 RÉSUMÉ:');
        console.log('='.repeat(30));
        console.log(`👤 Étudiant: ${student.name} (${student.matricule})`);
        console.log(`📚 Quiz total: ${publishedQuizzes.length}`);
        console.log(`📝 Soumissions créées: ${submissionsCreated}`);
        console.log(`📝 Soumissions totales: ${existingSubmissions.length + submissionsCreated}`);

        // Vérifier le résultat final
        const finalSubmissions = await SubmissionLog.find({ studentId: student._id });
        console.log(`✅ Vérification finale: ${finalSubmissions.length} soumissions au total`);

        // Afficher le mapping des statuts
        console.log('\n🎯 MAPPING DES STATUTS:');
        console.log('='.repeat(40));
        
        const submittedQuizIds = finalSubmissions.map(s => s.quizId.toString());
        
        for (const quiz of publishedQuizzes) {
            const isSubmitted = submittedQuizIds.includes(quiz._id.toString());
            const now = new Date();
            const isExpired = quiz.deadline && now > new Date(quiz.deadline);
            
            let status = '⏳ À FAIRE';
            if (isSubmitted) {
                status = '✅ TERMINÉ';
            } else if (isExpired) {
                status = '⏰ EXPIRÉ';
            }
            
            console.log(`${status} | ${quiz.title}`);
        }

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Déconnecté de MongoDB');
    }
}

// Exécuter le script
if (require.main === module) {
    addSubmissionsForStudent();
}

module.exports = addSubmissionsForStudent;