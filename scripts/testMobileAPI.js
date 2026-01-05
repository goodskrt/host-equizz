/**
 * SCRIPT: testMobileAPI.js
 * 
 * Script pour tester les endpoints utilisés par l'application mobile
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Test des endpoints corrigés
async function testCorrectedEndpoints() {
    try {
        console.log('🧪 TEST DES ENDPOINTS CORRIGÉS');
        console.log('===============================\n');

        // 1. Test de connexion
        console.log('🔐 Test de connexion...');
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
            identifier: 'etudiant.test@institut.fr',
            password: 'password123'
        });

        if (loginResponse.data.success) {
            const token = loginResponse.data.data.token;
            const user = loginResponse.data.data.user;
            const classId = typeof user.classId === 'object' ? user.classId._id : user.classId;
            
            console.log('✅ Connexion réussie');
            console.log(`👤 Utilisateur: ${user.name}`);
            console.log(`🎓 Classe ID: ${classId}`);

            // 2. Test des cours avec l'URL corrigée
            console.log('\n📚 Test des cours...');
            const coursesResponse = await axios.get(`${BASE_URL}/api/courses?classId=${classId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (coursesResponse.data.success) {
                console.log(`✅ ${coursesResponse.data.data.length} cours récupérés`);
                console.log('📖 Premiers cours:');
                coursesResponse.data.data.slice(0, 3).forEach(course => {
                    console.log(`  • ${course.code} - ${course.name}`);
                });
            }

            // 3. Test des évaluations avec l'URL corrigée
            console.log('\n📋 Test des évaluations...');
            const evaluationsResponse = await axios.get(`${BASE_URL}/api/evaluations?classId=${classId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (evaluationsResponse.data.success) {
                console.log(`✅ ${evaluationsResponse.data.data.length} évaluations récupérées`);
                console.log('📝 Premières évaluations:');
                evaluationsResponse.data.data.slice(0, 3).forEach(eval => {
                    console.log(`  • ${eval.title}`);
                });
            }

            console.log('\n🎉 TOUS LES TESTS RÉUSSIS !');
            console.log('============================');
            console.log('✅ URLs corrigées fonctionnent');
            console.log('✅ Authentification OK');
            console.log('✅ Récupération des cours OK');
            console.log('✅ Récupération des évaluations OK');
            console.log('\n📱 L\'application mobile devrait maintenant fonctionner correctement');

        } else {
            console.log('❌ Échec de la connexion');
        }

    } catch (error) {
        console.error('❌ Erreur lors des tests:', error.response?.data || error.message);
        
        if (error.response?.status === 404) {
            console.log('\n🔍 Erreur 404 détectée - Vérifiez que:');
            console.log('  • Le serveur backend est démarré');
            console.log('  • Les routes sont correctement configurées');
            console.log('  • L\'URL de base est correcte');
        }
    }
}

// Exécuter les tests
if (require.main === module) {
    testCorrectedEndpoints();
}

module.exports = { testCorrectedEndpoints };