/**
 * SCRIPT: testAPI.js
 * 
 * Script pour tester les endpoints de l'API d'évaluation
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test de connexion étudiant
async function testLogin() {
    try {
        console.log('🔐 Test de connexion étudiant...');
        
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            identifier: 'etudiant.test@institut.fr',
            password: 'password123'
        });

        if (response.data.success) {
            console.log('✅ Connexion réussie');
            console.log(`👤 Utilisateur: ${response.data.data.user.name}`);
            console.log(`🎓 Classe: ${response.data.data.user.classId?.code || response.data.data.user.classId}`);
            return {
                token: response.data.data.token,
                user: response.data.data.user,
                classId: typeof response.data.data.user.classId === 'object' 
                    ? response.data.data.user.classId._id || response.data.data.user.classId.id
                    : response.data.data.user.classId
            };
        } else {
            console.log('❌ Échec de la connexion');
            return null;
        }
    } catch (error) {
        console.error('❌ Erreur lors de la connexion:', error.response?.data || error.message);
        return null;
    }
}

// Test de récupération des cours
async function testGetCourses(token, classId) {
    try {
        console.log('\n📚 Test de récupération des cours...');
        
        const response = await axios.get(`${BASE_URL}/courses?classId=${classId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.data.success) {
            console.log(`✅ ${response.data.data.length} cours récupérés`);
            response.data.data.forEach(course => {
                console.log(`  📖 ${course.code} - ${course.name} (S${course.semester})`);
            });
            return response.data.data;
        } else {
            console.log('❌ Échec de la récupération des cours');
            return [];
        }
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des cours:', error.response?.data || error.message);
        return [];
    }
}

// Test de récupération des évaluations
async function testGetEvaluations(token, classId) {
    try {
        console.log('\n📋 Test de récupération des évaluations...');
        
        const response = await axios.get(`${BASE_URL}/evaluations?classId=${classId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.data.success) {
            console.log(`✅ ${response.data.data.length} évaluations récupérées`);
            
            // Grouper par statut
            const byStatus = response.data.data.reduce((acc, eval) => {
                acc[eval.status] = (acc[eval.status] || 0) + 1;
                return acc;
            }, {});
            
            console.log('📊 Répartition par statut:');
            Object.entries(byStatus).forEach(([status, count]) => {
                console.log(`  ${status}: ${count}`);
            });
            
            // Afficher quelques exemples
            console.log('\n📝 Exemples d\'évaluations:');
            response.data.data.slice(0, 3).forEach(eval => {
                console.log(`  • ${eval.title}`);
                console.log(`    📅 ${new Date(eval.startDate).toLocaleDateString()} → ${new Date(eval.endDate).toLocaleDateString()}`);
                console.log(`    📊 ${eval.totalResponses}/${eval.targetStudents} réponses`);
            });
            
            return response.data.data;
        } else {
            console.log('❌ Échec de la récupération des évaluations');
            return [];
        }
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des évaluations:', error.response?.data || error.message);
        return [];
    }
}

// Test de récupération d'une évaluation spécifique
async function testGetEvaluation(token, evaluationId) {
    try {
        console.log(`\n📋 Test de récupération de l'évaluation ${evaluationId}...`);
        
        const response = await axios.get(`${BASE_URL}/evaluations/${evaluationId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.data.success) {
            const eval = response.data.data;
            console.log('✅ Évaluation récupérée');
            console.log(`  📝 Titre: ${eval.title}`);
            console.log(`  📚 Type: ${eval.type}`);
            console.log(`  ❓ Questions: ${eval.questions.length}`);
            console.log(`  🔒 Anonyme: ${eval.isAnonymous ? 'Oui' : 'Non'}`);
            return eval;
        } else {
            console.log('❌ Échec de la récupération de l\'évaluation');
            return null;
        }
    } catch (error) {
        console.error('❌ Erreur lors de la récupération de l\'évaluation:', error.response?.data || error.message);
        return null;
    }
}

// Fonction principale de test
async function runTests() {
    console.log('🧪 TESTS DE L\'API D\'ÉVALUATION');
    console.log('================================\n');

    // 1. Test de connexion
    const auth = await testLogin();
    if (!auth) {
        console.log('❌ Impossible de continuer sans authentification');
        return;
    }

    // 2. Test des cours
    const courses = await testGetCourses(auth.token, auth.classId);
    
    // 3. Test des évaluations
    const evaluations = await testGetEvaluations(auth.token, auth.classId);
    
    // 4. Test d'une évaluation spécifique
    if (evaluations.length > 0) {
        await testGetEvaluation(auth.token, evaluations[0].id);
    }

    console.log('\n🎉 Tests terminés !');
    console.log('===================');
    console.log(`✅ ${courses.length} cours disponibles`);
    console.log(`✅ ${evaluations.length} évaluations disponibles`);
    console.log('\n🔗 L\'application mobile peut maintenant utiliser ces données');
}

// Exécuter les tests
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests };