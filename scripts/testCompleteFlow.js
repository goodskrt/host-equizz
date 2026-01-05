/**
 * Test complet du flux d'authentification et de récupération des données
 */

const axios = require('axios');

async function testCompleteFlow() {
    try {
        console.log('🌐 Test complet du flux API...');
        
        const baseURL = 'http://localhost:5000/api';
        
        // 1. Connexion
        console.log('🔐 Étape 1: Connexion...');
        const loginResponse = await axios.post(`${baseURL}/auth/login`, {
            identifier: '2223i278',
            password: 'password123'
        });
        
        if (!loginResponse.data.success) {
            console.error('❌ Échec de la connexion:', loginResponse.data);
            return;
        }
        
        const token = loginResponse.data.data.token;
        const user = loginResponse.data.data.user;
        console.log('✅ Connexion réussie pour:', user.name);
        console.log('🎫 Token obtenu:', token.substring(0, 20) + '...');
        
        // 2. Test des soumissions
        console.log('\n📋 Étape 2: Récupération des soumissions...');
        const submissionsResponse = await axios.get(`${baseURL}/student/submissions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('📊 Soumissions:');
        console.log('Status:', submissionsResponse.status);
        console.log('Success:', submissionsResponse.data.success);
        console.log('Nombre:', submissionsResponse.data.data.length);
        
        const submissions = submissionsResponse.data.data;
        submissions.forEach((sub, index) => {
            console.log(`  ${index + 1}. Quiz: ${sub.quizId}, Soumis: ${new Date(sub.submittedAt).toLocaleString()}`);
        });
        
        // 3. Test des quiz
        console.log('\n📝 Étape 3: Récupération des quiz...');
        const quizzesResponse = await axios.get(`${baseURL}/student/quizzes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('📊 Quiz:');
        console.log('Status:', quizzesResponse.status);
        console.log('Nombre:', quizzesResponse.data.length);
        
        const quizzes = quizzesResponse.data;
        const submittedQuizIds = submissions.map(sub => sub.quizId);
        
        // 4. Simulation de la logique frontend
        console.log('\n🔍 Étape 4: Simulation de la logique frontend...');
        const now = new Date();
        let stats = { pending: 0, completed: 0, expired: 0 };
        
        console.log('='.repeat(60));
        console.log('ANALYSE DES STATUTS (comme dans le frontend):');
        console.log('='.repeat(60));
        
        quizzes.forEach(quiz => {
            const isSubmitted = submittedQuizIds.includes(quiz._id);
            const isExpired = quiz.deadline && now > new Date(quiz.deadline);
            
            let finalStatus;
            if (isExpired) {
                finalStatus = 'EXPIRÉ';
                stats.expired++;
            } else if (isSubmitted) {
                finalStatus = 'TERMINÉ';
                stats.completed++;
            } else {
                finalStatus = 'À FAIRE';
                stats.pending++;
            }
            
            console.log(`📌 ${quiz.title}`);
            console.log(`   Course: ${quiz.courseId?.name || 'N/A'}`);
            console.log(`   Deadline: ${quiz.deadline ? new Date(quiz.deadline).toLocaleString() : 'Aucune'}`);
            console.log(`   Soumis: ${isSubmitted ? 'OUI' : 'NON'}`);
            console.log(`   Expiré: ${isExpired ? 'OUI' : 'NON'}`);
            console.log(`   → STATUT: ${finalStatus}`);
            console.log('');
        });
        
        // 5. Résumé final
        console.log('📊 RÉSUMÉ FINAL:');
        console.log('='.repeat(30));
        console.log(`📝 Total: ${quizzes.length}`);
        console.log(`⏳ À faire: ${stats.pending}`);
        console.log(`✅ Terminés: ${stats.completed}`);
        console.log(`❌ Expirés: ${stats.expired}`);
        console.log(`📋 Soumissions: ${submissions.length}`);
        
        console.log('\n✅ Test complet terminé avec succès!');
        console.log('🎯 Le frontend devrait maintenant afficher:');
        console.log(`   - ${stats.pending} quiz dans "À faire"`);
        console.log(`   - ${stats.completed} quiz dans "Terminées"`);
        console.log(`   - ${stats.expired} quiz dans "Expirées"`);
        
    } catch (error) {
        if (error.response) {
            console.error('❌ Erreur API:', error.response.status, error.response.data);
        } else if (error.request) {
            console.error('❌ Pas de réponse du serveur. Vérifiez que le serveur est démarré.');
        } else {
            console.error('❌ Erreur:', error.message);
        }
    }
}

testCompleteFlow();