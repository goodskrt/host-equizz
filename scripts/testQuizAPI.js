/**
 * Test spécifique de l'API des quiz
 */

require('dotenv').config();
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testQuizAPI() {
    try {
        console.log('🧪 TEST DE L\'API QUIZ');
        console.log('=====================\n');

        // 1. Connexion
        console.log('🔐 Test de connexion...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            identifier: 'etudiant.test@institut.fr',
            password: 'password123'
        });

        if (!loginResponse.data.success) {
            throw new Error('Échec de la connexion');
        }

        const token = loginResponse.data.data.token;
        const user = loginResponse.data.data.user;
        
        console.log('✅ Connexion réussie');
        console.log(`👤 Utilisateur: ${user.name}`);
        console.log(`🎓 Classe ID: ${user.classId._id}\n`);

        // 2. Test de l'endpoint quiz
        console.log('📝 Test des quiz...');
        const quizResponse = await axios.get(`${API_BASE}/student/quizzes`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log(`✅ ${quizResponse.data.length} quiz récupérés`);
        
        if (quizResponse.data.length > 0) {
            console.log('📝 Premiers quiz:');
            quizResponse.data.slice(0, 3).forEach(quiz => {
                console.log(`  • ${quiz.title} (${quiz.status})`);
            });
        } else {
            console.log('⚠️ Aucun quiz trouvé - Vérification nécessaire');
        }

        console.log('\n🎉 TEST TERMINÉ !');
        console.log('==================');

    } catch (error) {
        console.error('❌ Erreur:', error.response?.data || error.message);
    }
}

testQuizAPI();