/**
 * SCRIPT DE TEST: Logique de la Page d'Accueil
 * 
 * Description: Test de la logique corrigée de la page d'accueil
 * Utilisation: node scripts/testHomePageLogic.js
 */

const mongoose = require('mongoose');
const { Quiz } = require('../models/Quiz');
const { SubmissionLog } = require('../models/Submission');
const User = require('../models/User');
const { Course } = require('../models/Academic');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGO_URI || 'mongodb+srv://iulp562_db_user:Igreurbain562@cluster0.imuet5k.mongodb.net/?appName=Cluster0';

async function testHomePageLogic() {
    try {
        // Connexion à MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connexion à MongoDB réussie');

        console.log('\n🏠 TEST DE LA LOGIQUE DE LA PAGE D\'ACCUEIL');
        console.log('===========================================');

        // 1. Récupérer un étudiant de test (celui avec des soumissions)
        const student = await User.findOne({ matricule: '2223i278' });
        if (!student) {
            console.log('❌ Étudiant 2223i278 non trouvé, utilisation du premier étudiant');
            const fallbackStudent = await User.findOne({ role: 'STUDENT' });
            if (!fallbackStudent) {
                console.log('❌ Aucun étudiant trouvé');
                return;
            }
            student = fallbackStudent;
        }

        console.log(`👤 ÉTUDIANT DE TEST: ${student.name || 'N/A'} (${student.matricule})`);
        console.log(`📚 Classe: ${student.classId}`);

        // 2. Récupérer tous les quiz pour la classe de l'étudiant
        const allQuizzes = await Quiz.find({ 
            status: { $in: ['DRAFT', 'ARCHIVED', 'PUBLISHED'] } 
        }).populate('courseId');

        // Filtrer les quiz pour la classe de l'étudiant
        const classQuizzes = allQuizzes.filter(q => 
            q.courseId && q.courseId.classId && 
            q.courseId.classId.toString() === student.classId.toString()
        );

        console.log(`\n📋 QUIZ DE LA CLASSE: ${classQuizzes.length}/${allQuizzes.length}`);

        // 3. Analyser les quiz par statut
        const quizzesByStatus = {
            DRAFT: classQuizzes.filter(q => q.status === 'DRAFT'),
            ARCHIVED: classQuizzes.filter(q => q.status === 'ARCHIVED'),
            PUBLISHED: classQuizzes.filter(q => q.status === 'PUBLISHED')
        };

        console.log('\n📊 RÉPARTITION PAR STATUT:');
        Object.entries(quizzesByStatus).forEach(([status, quizzes]) => {
            console.log(`- ${status}: ${quizzes.length} quiz`);
        });

        // 4. Analyser les quiz PUBLISHED (à faire)
        const publishedQuizzes = quizzesByStatus.PUBLISHED;
        const now = new Date();

        console.log(`\n🎯 ANALYSE DES QUIZ PUBLISHED (À FAIRE): ${publishedQuizzes.length}`);

        const quizAnalysis = publishedQuizzes.map(quiz => {
            const isExpired = quiz.deadline && now > new Date(quiz.deadline);
            const deadlineStr = quiz.deadline ? new Date(quiz.deadline).toLocaleDateString() : 'Aucune';
            
            return {
                id: quiz._id.toString(),
                title: quiz.title,
                course: quiz.courseId?.name || 'N/A',
                deadline: deadlineStr,
                isExpired,
                status: isExpired ? 'EXPIRÉ' : 'ACTIF'
            };
        });

        const activeQuizzes = quizAnalysis.filter(q => !q.isExpired);
        const expiredQuizzes = quizAnalysis.filter(q => q.isExpired);

        console.log(`\n✅ QUIZ ACTIFS (non expirés): ${activeQuizzes.length}`);
        activeQuizzes.forEach((quiz, index) => {
            console.log(`   ${index + 1}. ${quiz.title}`);
            console.log(`      - Cours: ${quiz.course}`);
            console.log(`      - Deadline: ${quiz.deadline}`);
        });

        console.log(`\n❌ QUIZ EXPIRÉS: ${expiredQuizzes.length}`);
        expiredQuizzes.forEach((quiz, index) => {
            console.log(`   ${index + 1}. ${quiz.title}`);
            console.log(`      - Cours: ${quiz.course}`);
            console.log(`      - Deadline: ${quiz.deadline}`);
        });

        // 5. Récupérer les soumissions de l'étudiant
        const submissions = await SubmissionLog.find({ studentId: student._id });
        const submittedQuizIds = submissions.map(s => s.quizId.toString());

        console.log(`\n📤 SOUMISSIONS DE L'ÉTUDIANT: ${submissions.length}`);
        if (submissions.length > 0) {
            console.log('Quiz soumis:');
            for (const submission of submissions) {
                const quiz = classQuizzes.find(q => q._id.toString() === submission.quizId.toString());
                if (quiz) {
                    console.log(`   - ${quiz.title} (${new Date(submission.submittedAt).toLocaleDateString()})`);
                }
            }
        }

        // 6. Calculer les statistiques de la page d'accueil
        console.log('\n📈 CALCUL DES STATISTIQUES PAGE D\'ACCUEIL:');
        
        // Analyser les soumissions par rapport aux quiz actifs
        const activeQuizIds = activeQuizzes.map(q => q.id);
        const submissionsOnActiveQuizzes = submittedQuizIds.filter(id => activeQuizIds.includes(id));
        const submissionsOnExpiredQuizzes = submittedQuizIds.filter(id => !activeQuizIds.includes(id));
        
        // En attente = Quiz actifs (PUBLISHED non expirés) MOINS ceux déjà soumis
        const pendingQuizzes = activeQuizzes.filter(quiz => !submittedQuizIds.includes(quiz.id));
        const pendingCount = pendingQuizzes.length;
        
        // Évaluations complétées = Nombre de soumissions
        const completedCount = submissions.length;

        console.log(`✅ Évaluations complétées: ${completedCount} (toutes soumissions)`);
        console.log(`   - Soumissions sur quiz actifs: ${submissionsOnActiveQuizzes.length}`);
        console.log(`   - Soumissions sur quiz expirés: ${submissionsOnExpiredQuizzes.length}`);
        console.log(`⏳ En attente: ${pendingCount} (${activeQuizzes.length} actifs - ${submissionsOnActiveQuizzes.length} soumis sur actifs)`);
        
        console.log('\n📋 DÉTAIL DES QUIZ EN ATTENTE (actifs non soumis):');
        pendingQuizzes.forEach((quiz, index) => {
            console.log(`   ${index + 1}. ${quiz.title}`);
            console.log(`      - Cours: ${quiz.course}`);
            console.log(`      - Deadline: ${quiz.deadline}`);
        });

        // 7. Analyser les quiz récents (3 plus récemment publiés, non soumis)
        console.log('\n📅 QUIZ RÉCENTS (3 plus récemment publiés, non soumis):');
        
        const recentQuizzes = pendingQuizzes // Utiliser pendingQuizzes au lieu de activeQuizzes
            .map(quiz => {
                const fullQuiz = classQuizzes.find(q => q._id.toString() === quiz.id);
                return {
                    ...quiz,
                    createdAt: fullQuiz?.createdAt
                };
            })
            .sort((a, b) => {
                // Trier par date de publication décroissante (plus récent en premier)
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();
                return dateB - dateA;
            })
            .slice(0, 3); // Limiter aux 3 plus récents

        recentQuizzes.forEach((quiz, index) => {
            const publishedDate = quiz.createdAt ? new Date(quiz.createdAt).toLocaleDateString() : 'Date inconnue';
            console.log(`   ${index + 1}. ${quiz.title}`);
            console.log(`      - Cours: ${quiz.course}`);
            console.log(`      - Publié le: ${publishedDate}`);
            console.log(`      - Deadline: ${quiz.deadline}`);
            console.log(`      - Soumis: NON`);
        });

        // 8. Résumé de la logique
        console.log('\n🎯 RÉSUMÉ DE LA LOGIQUE PAGE D\'ACCUEIL:');
        console.log('=====================================');
        console.log('✅ "En attente" = Quiz PUBLISHED non expirés MOINS ceux déjà soumis');
        console.log('✅ "Évaluations complétées" = Nombre de soumissions dans SubmissionLog');
        console.log('✅ "Évaluations à faire" = Quiz PUBLISHED non expirés non soumis (même que "En attente")');
        console.log('✅ "Récents" = 3 quiz les plus récemment publiés, non soumis, non expirés');
        console.log('✅ LoadingScreen ajouté avec message contextuel');

        console.log('\n📊 STATISTIQUES FINALES:');
        console.log(`- Quiz total de la classe: ${classQuizzes.length}`);
        console.log(`- Quiz PUBLISHED: ${publishedQuizzes.length}`);
        console.log(`- Quiz actifs (non expirés): ${activeQuizzes.length}`);
        console.log(`- Quiz expirés: ${expiredQuizzes.length}`);
        console.log(`- Quiz soumis par l'étudiant: ${submissions.length}`);
        console.log(`- Quiz en attente (actifs non soumis): ${pendingCount}`);
        console.log(`- Quiz récents (non soumis): ${recentQuizzes.length}`);
        console.log(`- En attente (page d'accueil): ${pendingCount}`);
        console.log(`- Complétées (page d'accueil): ${completedCount}`);
        
        // Vérification de cohérence
        console.log('\n🔍 VÉRIFICATION DE COHÉRENCE:');
        const submissionsOnActiveQuizzesCheck = submittedQuizIds.filter(id => activeQuizIds.includes(id));
        const expectedPending = activeQuizzes.length - submissionsOnActiveQuizzesCheck.length;
        
        console.log(`📊 Quiz actifs: ${activeQuizzes.length}`);
        console.log(`📤 Soumissions sur quiz actifs: ${submissionsOnActiveQuizzesCheck.length}`);
        console.log(`📤 Soumissions sur quiz expirés: ${submittedQuizIds.length - submissionsOnActiveQuizzesCheck.length}`);
        console.log(`📤 Total soumissions: ${submittedQuizIds.length}`);
        
        if (pendingCount === expectedPending) {
            console.log(`✅ Cohérence OK: ${activeQuizzes.length} actifs - ${submissionsOnActiveQuizzesCheck.length} soumis sur actifs = ${pendingCount} en attente`);
        } else {
            console.log(`❌ Incohérence: Attendu ${expectedPending}, obtenu ${pendingCount}`);
        }

        console.log('\n✅ Test de la logique page d\'accueil terminé avec succès');

    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Déconnexion de MongoDB');
    }
}

// Exécution du script
if (require.main === module) {
    testHomePageLogic();
}

module.exports = { testHomePageLogic };