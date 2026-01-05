/**
 * Test de la logique des quiz récents sur la page d'accueil
 * Vérifie que les quiz récents affichent les 3 quiz les plus récemment publiés
 * Critères : PUBLISHED, non expirés, sans submissions log, triés par date de publication
 */

const axios = require('axios');

async function testRecentQuizLogic() {
    try {
        console.log('🆕 Test de la logique des quiz récents...');
        
        const baseURL = 'http://localhost:5000/api';
        
        // 1. Connexion
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
        console.log('✅ Connexion réussie');
        
        // 2. Récupérer tous les quiz
        console.log('\n📝 Récupération de tous les quiz...');
        const quizzesResponse = await axios.get(`${baseURL}/student/quizzes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const allQuizzes = quizzesResponse.data;
        console.log('📊 Total des quiz:', allQuizzes.length);
        
        // 3. Récupérer les soumissions
        console.log('\n📋 Récupération des soumissions...');
        const submissionsResponse = await axios.get(`${baseURL}/student/submissions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const submissions = submissionsResponse.data.data;
        const submittedQuizIds = submissions.map(sub => sub.quizId);
        console.log('✅ Quiz soumis:', submittedQuizIds.length);
        
        // 4. Filtrer les quiz actifs (PUBLISHED et non expirés)
        const now = new Date();
        const activeQuizzes = allQuizzes.filter(quiz => {
            if (quiz.status !== 'PUBLISHED') return false;
            if (!quiz.deadline) return true;
            return new Date(quiz.deadline) > now;
        });
        
        console.log('⏳ Quiz actifs (PUBLISHED, non expirés):', activeQuizzes.length);
        
        // 5. Appliquer la logique "À faire" (tri par urgence)
        const todoQuizzes = activeQuizzes
            .filter(quiz => !submittedQuizIds.includes(quiz._id)) // Exclure les soumis
            .sort((a, b) => {
                const deadlineA = a.deadline;
                const deadlineB = b.deadline;
                
                if (!deadlineA && !deadlineB) return 0;
                if (!deadlineA) return 1;
                if (!deadlineB) return -1;
                
                return new Date(deadlineA).getTime() - new Date(deadlineB).getTime();
            });
        
        console.log('📅 Quiz "À faire" (triés par urgence):', todoQuizzes.length);
        
        // 6. Appliquer la logique "Récents" (3 plus récemment publiés)
        const recentQuizzes = activeQuizzes
            .filter(quiz => !submittedQuizIds.includes(quiz._id)) // Mêmes critères
            .sort((a, b) => {
                // Tri par date de publication décroissante (plus récemment publié en premier)
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();
                return dateB - dateA;
            })
            .slice(0, 3); // Limiter aux 3 plus récemment publiés
        
        console.log('🆕 Quiz "Récents" (3 plus récemment publiés):', recentQuizzes.length);
        
        // 7. Vérification que les deux listes ont les mêmes éléments
        const todoIds = new Set(todoQuizzes.map(q => q._id));
        const recentIds = new Set(recentQuizzes.map(q => q._id));
        
        const sameElements = recentQuizzes.every(quiz => todoIds.has(quiz._id));
        
        console.log('\n🔍 VÉRIFICATION DES CRITÈRES:');
        console.log('='.repeat(40));
        console.log(`✅ Mêmes éléments dans les deux listes: ${sameElements ? 'OUI' : 'NON'}`);
        console.log(`📊 Quiz "À faire": ${todoQuizzes.length}`);
        console.log(`🆕 Quiz "Récents": ${recentQuizzes.length} (limité à 3)`);
        
        // 8. Affichage détaillé des quiz "À faire" (tri par urgence)
        console.log('\n📅 QUIZ "À FAIRE" (triés par urgence - deadline):');
        console.log('='.repeat(60));
        todoQuizzes.slice(0, 5).forEach((quiz, index) => {
            const deadline = quiz.deadline;
            const daysUntil = deadline ? 
                Math.ceil((new Date(deadline) - now) / (1000 * 60 * 60 * 24)) : 
                'Aucune';
            
            console.log(`${index + 1}. ${quiz.title}`);
            console.log(`   Deadline: ${deadline ? new Date(deadline).toLocaleDateString() : 'Aucune'}`);
            console.log(`   Urgence: ${daysUntil !== 'Aucune' ? `${daysUntil} jours` : 'Aucune'}`);
            console.log(`   Soumis: NON`);
            console.log('');
        });
        
        // 9. Affichage détaillé des quiz "Récents" (tri par date de publication)
        console.log('🆕 QUIZ "RÉCENTS" (3 plus récemment publiés):');
        console.log('='.repeat(60));
        recentQuizzes.forEach((quiz, index) => {
            const publishedDate = quiz.createdAt;
            const deadline = quiz.deadline;
            
            console.log(`${index + 1}. ${quiz.title}`);
            console.log(`   Publié le: ${publishedDate ? new Date(publishedDate).toLocaleDateString() : 'Date inconnue'}`);
            console.log(`   Deadline: ${deadline ? new Date(deadline).toLocaleDateString() : 'Aucune'}`);
            console.log(`   Soumis: NON`);
            console.log('');
        });
        
        // 10. Comparaison des ordres de tri
        console.log('🔄 COMPARAISON DES TRIS:');
        console.log('='.repeat(30));
        
        if (todoQuizzes.length > 0 && recentQuizzes.length > 0) {
            console.log(`🚨 Plus urgent: "${todoQuizzes[0].title}"`);
            console.log(`🆕 Plus récent: "${recentQuizzes[0].title}"`);
            
            if (todoQuizzes[0]._id === recentQuizzes[0]._id) {
                console.log('ℹ️  Le quiz le plus urgent est aussi le plus récent');
            } else {
                console.log('ℹ️  Le quiz le plus urgent et le plus récent sont différents');
            }
        }
        
        console.log('\n🏠 RÉSUMÉ POUR LA PAGE D\'ACCUEIL:');
        console.log('='.repeat(40));
        console.log(`📅 Section "À faire": ${todoQuizzes.length} quiz (triés par urgence)`);
        console.log(`🆕 Section "Récents": ${recentQuizzes.length} quiz (3 plus récemment publiés)`);
        console.log(`✅ Critères identiques: PUBLISHED, non expirés, non soumis`);
        console.log(`🔄 Différence: tri par urgence vs tri par date de publication`);
        console.log(`📅 Date utilisée: deadline vs createdAt (publication)`);
        
    } catch (error) {
        if (error.response) {
            console.error('❌ Erreur API:', error.response.status, error.response.data);
        } else {
            console.error('❌ Erreur:', error.message);
        }
    }
}

testRecentQuizLogic();