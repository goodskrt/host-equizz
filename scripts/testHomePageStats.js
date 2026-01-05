/**
 * Test des statistiques de la page d'accueil
 * Vérifie que le nombre d'évaluations terminées correspond aux submissions log
 */

const axios = require('axios');

async function testHomePageStats() {
    try {
        console.log('🏠 Test des statistiques de la page d\'accueil...');
        
        const baseURL = 'http://localhost:5000/api';
        
        // 1. Connexion avec l'étudiant 2223i278
        console.log('🔐 Connexion avec 2223i278...');
        const loginResponse = await axios.post(`${baseURL}/auth/login`, {
            identifier: '2223i278',
            password: 'password123'
        });
        
        if (!loginResponse.data.success) {
            console.error('❌ Échec connexion:', loginResponse.data);
            return;
        }
        
        const token = loginResponse.data.data.token;
        const user = loginResponse.data.data.user;
        console.log('✅ Connexion réussie pour:', user.name);
        
        // 2. Récupérer les soumissions (évaluations terminées)
        console.log('\n📋 Récupération des évaluations terminées...');
        const submissionsResponse = await axios.get(`${baseURL}/student/submissions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const completedCount = submissionsResponse.data.data.length;
        console.log('✅ Évaluations terminées:', completedCount);
        
        // 3. Récupérer tous les quiz
        console.log('\n📝 Récupération de tous les quiz...');
        const quizzesResponse = await axios.get(`${baseURL}/student/quizzes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const allQuizzes = quizzesResponse.data;
        console.log('📊 Total des quiz:', allQuizzes.length);
        
        // 4. Filtrer les quiz actifs (PUBLISHED et non expirés)
        const now = new Date();
        const activeQuizzes = allQuizzes.filter(quiz => {
            if (quiz.status !== 'PUBLISHED') return false;
            
            if (!quiz.deadline) return true;
            return new Date(quiz.deadline) > now;
        });
        
        const pendingCount = activeQuizzes.length;
        console.log('⏳ Quiz à faire (actifs):', pendingCount);
        
        // 5. Simulation des statistiques de la page d'accueil
        console.log('\n🏠 STATISTIQUES PAGE D\'ACCUEIL:');
        console.log('='.repeat(40));
        console.log(`📊 Évaluations complétées: ${completedCount}`);
        console.log(`⏳ En attente: ${pendingCount}`);
        console.log(`📝 Total des quiz: ${allQuizzes.length}`);
        
        // 6. Détail des soumissions
        console.log('\n📋 DÉTAIL DES ÉVALUATIONS TERMINÉES:');
        console.log('='.repeat(50));
        submissionsResponse.data.data.forEach((submission, index) => {
            const quiz = allQuizzes.find(q => q._id === submission.quizId);
            const quizTitle = quiz ? quiz.title : 'Quiz non trouvé';
            console.log(`${index + 1}. ${quizTitle}`);
            console.log(`   - ID: ${submission.quizId}`);
            console.log(`   - Soumis le: ${new Date(submission.submittedAt).toLocaleString()}`);
            console.log('');
        });
        
        // 7. Détail des quiz à faire
        console.log('⏳ DÉTAIL DES QUIZ À FAIRE:');
        console.log('='.repeat(30));
        activeQuizzes.forEach((quiz, index) => {
            console.log(`${index + 1}. ${quiz.title}`);
            console.log(`   - ID: ${quiz._id}`);
            console.log(`   - Deadline: ${quiz.deadline ? new Date(quiz.deadline).toLocaleString() : 'Aucune'}`);
            console.log('');
        });
        
        // 8. Vérification de cohérence
        console.log('🔍 VÉRIFICATION DE COHÉRENCE:');
        console.log('='.repeat(35));
        
        const submittedQuizIds = submissionsResponse.data.data.map(s => s.quizId);
        const publishedQuizzes = allQuizzes.filter(q => q.status === 'PUBLISHED');
        const expiredQuizzes = publishedQuizzes.filter(q => q.deadline && new Date(q.deadline) <= now);
        
        console.log(`📝 Quiz PUBLISHED: ${publishedQuizzes.length}`);
        console.log(`✅ Quiz soumis: ${completedCount}`);
        console.log(`❌ Quiz expirés: ${expiredQuizzes.length}`);
        console.log(`⏳ Quiz à faire: ${pendingCount}`);
        console.log(`🧮 Vérification: ${completedCount} + ${pendingCount} + ${expiredQuizzes.length} = ${completedCount + pendingCount + expiredQuizzes.length} (vs ${publishedQuizzes.length} PUBLISHED)`);
        
        if (completedCount + pendingCount + expiredQuizzes.length === publishedQuizzes.length) {
            console.log('✅ Cohérence vérifiée !');
        } else {
            console.log('⚠️ Incohérence détectée dans les calculs');
        }
        
        console.log('\n🎯 RÉSULTAT ATTENDU SUR LA PAGE D\'ACCUEIL:');
        console.log(`   📊 Évaluations complétées: ${completedCount}`);
        console.log(`   ⏳ En attente: ${pendingCount}`);
        
    } catch (error) {
        if (error.response) {
            console.error('❌ Erreur API:', error.response.status, error.response.data);
        } else {
            console.error('❌ Erreur:', error.message);
        }
    }
}

testHomePageStats();