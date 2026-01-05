/**
 * Script pour tester l'API des classes éligibles
 */

require('dotenv').config();
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testAPI() {
    try {
        console.log('🔐 Connexion avec l\'utilisateur de test...');
        
        // 1. Se connecter
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            identifier: 'test.student@example.com',
            password: 'password123'
        });

        if (!loginResponse.data.success) {
            console.error('❌ Échec de la connexion:', loginResponse.data.error);
            return;
        }

        const token = loginResponse.data.data.token;
        const user = loginResponse.data.data.user;
        
        console.log('✅ Connexion réussie');
        console.log(`👤 Utilisateur: ${user.firstName} ${user.lastName}`);
        console.log(`🏫 Classe: ${user.classId?.code || 'Non définie'}`);

        // 2. Récupérer les classes éligibles
        console.log('\n📚 Récupération des classes éligibles...');
        
        const classesResponse = await axios.get(`${API_BASE}/student/eligible-classes`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('📥 Réponse complète:', JSON.stringify(classesResponse.data, null, 2));

        if (classesResponse.data.success) {
            const { currentClass, eligibleClasses } = classesResponse.data.data;
            
            console.log('\n🏫 Classe actuelle:');
            console.log(`  - Code: ${currentClass.code}`);
            console.log(`  - Spécialité: ${currentClass.speciality}`);
            console.log(`  - Niveau: ${currentClass.level}`);
            console.log(`  - Langue: ${currentClass.language}`);
            console.log(`  - Année: ${currentClass.academicYear?.label}`);

            console.log(`\n📋 Classes éligibles (${eligibleClasses.length}) :`);
            eligibleClasses.forEach((classe, index) => {
                console.log(`  ${index + 1}. ${classe.code}`);
                console.log(`     - Spécialité: ${classe.speciality}, Niveau: ${classe.level}, Langue: ${classe.language}`);
                console.log(`     - Année: ${classe.academicYear?.label}`);
                console.log(`     - Raison: ${classe.reason}`);
                console.log('');
            });

            if (eligibleClasses.length === 0) {
                console.log('⚠️ Aucune classe éligible trouvée');
            }
        } else {
            console.error('❌ Erreur lors de la récupération:', classesResponse.data.error);
        }

    } catch (error) {
        console.error('❌ Erreur lors du test:', error.response?.data || error.message);
    }
}

// Exécution du script
if (require.main === module) {
    testAPI();
}

module.exports = { testAPI };