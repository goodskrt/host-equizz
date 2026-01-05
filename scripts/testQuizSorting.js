/**
 * Test du tri des quiz sur la page d'accueil
 * Vérifie que les quiz sont triés par deadline (plus proche en premier)
 * et que les quiz récents sont triés par date de création/modification
 */

const axios = require('axios');

async function testQuizSorting() {
    try {
        console.log('📅 Test du tri des quiz sur la page d\'accueil...');
        
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
        
        // 3. Filtrer les quiz actifs (PUBLISHED et non expirés)
        const now = new Date();
        const activeQuizzes = allQuizzes.filter(quiz => {
            if (quiz.status !== 'PUBLISHED') return false;
            if (!quiz.deadline) return true;
            return new Date(quiz.deadline) > now;
        });
        
        console.log('⏳ Quiz actifs (PUBLISHED, non expirés):', activeQuizzes.length);
        
        // 4. Trier par deadline (plus proche en premier = plus urgent)
        activeQuizzes.sort((a, b) => {
            const deadlineA = a.deadline;
            const deadlineB = b.deadline;
            
            // Si pas de deadline, mettre à la fin
            if (!deadlineA && !deadlineB) return 0;
            if (!deadlineA) return 1;
            if (!deadlineB) return -1;
            
            // Trier par deadline croissante (plus proche = plus urgent = en haut)
            return new Date(deadlineA).getTime() - new Date(deadlineB).getTime();
        });
        
        console.log('\n📅 QUIZ ACTIFS TRIÉS PAR URGENCE (deadline):');
        console.log('='.repeat(60));
        activeQuizzes.forEach((quiz, index) => {
            const deadline = quiz.deadline;
            const daysUntilDeadline = deadline ? 
                Math.ceil((new Date(deadline) - now) / (1000 * 60 * 60 * 24)) : 
                'Aucune';
            
            console.log(`${index + 1}. ${quiz.title}`);
            console.log(`   Deadline: ${deadline ? new Date(deadline).toLocaleString() : 'Aucune'}`);
            console.log(`   Urgence: ${daysUntilDeadline !== 'Aucune' ? `${daysUntilDeadline} jours` : 'Aucune'}`);
            console.log('');
        });
        
        // 5. Trier tous les quiz par date de création/modification (récents)
        const recentQuizzes = [...allQuizzes]
            .sort((a, b) => {
                const dateA = new Date(a.updatedAt || a.createdAt).getTime();
                const dateB = new Date(b.updatedAt || b.createdAt).getTime();
                
                // Trier par date décroissante (plus récent en premier)
                return dateB - dateA;
            })
            .slice(0, 5);
        
        console.log('🆕 QUIZ RÉCENTS (par date de création/modification):');
        console.log('='.repeat(60));
        recentQuizzes.forEach((quiz, index) => {
            const date = quiz.updatedAt || quiz.createdAt;
            const isActive = quiz.status === 'PUBLISHED' && 
                (!quiz.deadline || new Date(quiz.deadline) > now);
            
            console.log(`${index + 1}. ${quiz.title}`);
            console.log(`   Créé/Modifié: ${date ? new Date(date).toLocaleString() : 'Date inconnue'}`);
            console.log(`   Statut: ${quiz.status} ${isActive ? '(Actif)' : '(Inactif)'}`);
            console.log('');
        });
        
        // 6. Vérification de l'ordre de tri
        console.log('🔍 VÉRIFICATION DU TRI:');
        console.log('='.repeat(30));
        
        // Vérifier que les quiz actifs sont bien triés par deadline
        let correctSortingActive = true;
        for (let i = 0; i < activeQuizzes.length - 1; i++) {
            const currentDeadline = activeQuizzes[i].deadline;
            const nextDeadline = activeQuizzes[i + 1].deadline;
            
            if (currentDeadline && nextDeadline) {
                if (new Date(currentDeadline) > new Date(nextDeadline)) {
                    correctSortingActive = false;
                    break;
                }
            }
        }
        
        // Vérifier que les quiz récents sont bien triés par date
        let correctSortingRecent = true;
        for (let i = 0; i < recentQuizzes.length - 1; i++) {
            const currentDate = new Date(recentQuizzes[i].updatedAt || recentQuizzes[i].createdAt);
            const nextDate = new Date(recentQuizzes[i + 1].updatedAt || recentQuizzes[i + 1].createdAt);
            
            if (currentDate < nextDate) {
                correctSortingRecent = false;
                break;
            }
        }
        
        console.log(`✅ Tri des quiz actifs par urgence: ${correctSortingActive ? 'CORRECT' : 'INCORRECT'}`);
        console.log(`✅ Tri des quiz récents par date: ${correctSortingRecent ? 'CORRECT' : 'INCORRECT'}`);
        
        // 7. Résumé pour la page d'accueil
        console.log('\n🏠 RÉSUMÉ POUR LA PAGE D\'ACCUEIL:');
        console.log('='.repeat(40));
        console.log(`📅 Quiz à faire (triés par urgence): ${activeQuizzes.length}`);
        console.log(`🆕 Quiz récents: ${recentQuizzes.length}`);
        
        if (activeQuizzes.length > 0) {
            const mostUrgent = activeQuizzes[0];
            const deadline = mostUrgent.deadline;
            const daysUntil = deadline ? 
                Math.ceil((new Date(deadline) - now) / (1000 * 60 * 60 * 24)) : 
                'Aucune';
            console.log(`🚨 Plus urgent: "${mostUrgent.title}" (${daysUntil !== 'Aucune' ? `${daysUntil} jours` : 'pas de deadline'})`);
        }
        
        if (recentQuizzes.length > 0) {
            const mostRecent = recentQuizzes[0];
            const date = mostRecent.updatedAt || mostRecent.createdAt;
            console.log(`🆕 Plus récent: "${mostRecent.title}" (${date ? new Date(date).toLocaleDateString() : 'date inconnue'})`);
        }
        
    } catch (error) {
        if (error.response) {
            console.error('❌ Erreur API:', error.response.status, error.response.data);
        } else {
            console.error('❌ Erreur:', error.message);
        }
    }
}

testQuizSorting();