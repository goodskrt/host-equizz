/**
 * Script de test pour l'API des soumissions
 * Teste l'endpoint /api/student/submissions via HTTP
 */

const axios = require('axios');

async function testSubmissionAPI() {
    try {
        console.log('🌐 Test de l\'API des soumissions...');
        
        // Configuration de base
        const baseURL = 'http://localhost:5000/api';
        
        // 1. D'abord, se connecter pour obtenir un token
        console.log('🔐 Connexion avec l\'étudiant 2223i278...');
        
        const loginResponse = await axios.post(`${baseURL}/auth/login`, {
            identifier: '2223i278', // Using matricule as identifier
            password: 'password123'
        });
        
        if (!loginResponse.data.success) {
            console.error('❌ Échec de la connexion:', loginResponse.data.message);
            return;
        }
        
        const token = loginResponse.data.token;
        console.log('✅ Connexion réussie, token obtenu');
        
        // 2. Tester l'endpoint des quiz d'abord
        console.log('📝 Récupération des quiz...');
        
        const quizzesResponse = await axios.get(`${baseURL}/student/quizzes`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('📊 Réponse des quiz:');
        console.log('Status:', quizzesResponse.status);
        console.log('Nombre de quiz:', quizzesResponse.data.length);
        
        if (quizzesResponse.data.length > 0) {
            console.log('Premier quiz:', JSON.stringify(quizzesResponse.data[0], null, 2));
        }
        
        // 3. Tester l'endpoint des soumissions
        console.log('\n📋 Récupération des soumissions...');
        
        const submissionsResponse = await axios.get(`${baseURL}/student/submissions`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('📊 Réponse des soumissions:');
        console.log('Status:', submissionsResponse.status);
        console.log('Data:', JSON.stringify(submissionsResponse.data, null, 2));
        
        // 4. Analyser la logique de mapping
        const submissions = submissionsResponse.data.data || [];
        const quizzes = quizzesResponse.data || [];
        
        console.log('\n🔍 ANALYSE DE LA LOGIQUE:');
        console.log('='.repeat(40));
        console.log(`📋 Soumissions trouvées: ${submissions.length}`);
        console.log(`📝 Quiz disponibles: ${quizzes.length}`);
        
        const submittedQuizIds = submissions.map(sub => sub.quizId);
        console.log('📋 Quiz soumis:', submittedQuizIds);
        
        const now = new Date();
        let stats = { pending: 0, completed: 0, expired: 0 };
        
        quizzes.forEach(quiz => {
            const isSubmitted = submittedQuizIds.includes(quiz._id);
            const isExpired = quiz.deadline && now > new Date(quiz.deadline);
            
            let status;
            if (isExpired) {
                status = 'expired';
                stats.expired++;
            } else if (isSubmitted) {
                status = 'completed';
                stats.completed++;
            } else {
                status = 'pending';
                stats.pending++;
            }
            
            console.log(`📌 ${quiz.title}: ${status.toUpperCase()}`);
        });
        
        console.log('\n📊 STATISTIQUES:');
        console.log(`⏳ À faire: ${stats.pending}`);
        console.log(`✅ Terminés: ${stats.completed}`);
        console.log(`❌ Expirés: ${stats.expired}`);
        
    } catch (error) {
        if (error.response) {
            console.error('❌ Erreur API:', error.response.status, error.response.data);
        } else if (error.request) {
            console.error('❌ Pas de réponse du serveur. Le serveur est-il démarré sur le port 5000?');
        } else {
            console.error('❌ Erreur:', error.message);
        }
    }
}

// Exécuter le test
testSubmissionAPI();