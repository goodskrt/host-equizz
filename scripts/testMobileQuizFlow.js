/**
 * Test complet du flux quiz mobile
 * Simule exactement ce que fait l'application mobile
 */

require('dotenv').config();
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testMobileQuizFlow() {
    try {
        console.log('🧪 TEST COMPLET DU FLUX QUIZ MOBILE');
        console.log('=====================================\n');

        // 1. Connexion (comme dans l'app mobile)
        console.log('🔐 Étape 1: Connexion utilisateur...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            identifier: 'etudiant.test@institut.fr',
            password: 'password123'
        });

        console.log('📥 Structure de la réponse de connexion:');
        console.log(JSON.stringify(loginResponse.data, null, 2));

        if (!loginResponse.data.success) {
            throw new Error('Échec de la connexion');
        }

        const token = loginResponse.data.data.token;
        const user = loginResponse.data.data.user;
        
        console.log('✅ Connexion réussie');
        console.log(`👤 Utilisateur: ${user.name}`);
        console.log(`🎓 Classe ID: ${user.classId._id}`);
        console.log(`🔑 Token: ${token.substring(0, 20)}...`);

        // 2. Récupération des quiz (endpoint exact de l'app mobile)
        console.log('\n📝 Étape 2: Récupération des quiz...');
        const quizResponse = await axios.get(`${API_BASE}/student/quizzes`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log(`✅ Statut: ${quizResponse.status}`);
        console.log(`📊 Nombre de quiz: ${quizResponse.data.length}`);
        
        if (quizResponse.data.length > 0) {
            console.log('\n📝 Structure du premier quiz:');
            console.log(JSON.stringify(quizResponse.data[0], null, 2));
            
            console.log('\n📋 Liste des quiz:');
            quizResponse.data.forEach((quiz, index) => {
                console.log(`  ${index + 1}. ${quiz.title}`);
                console.log(`     - ID: ${quiz._id}`);
                console.log(`     - Cours: ${quiz.courseId ? (quiz.courseId.name || quiz.courseId) : 'N/A'}`);
                console.log(`     - Type: ${quiz.type}`);
                console.log(`     - Statut: ${quiz.status}`);
                console.log(`     - Questions: ${quiz.questions.length}`);
                console.log(`     - Deadline: ${quiz.deadline || 'Aucune'}`);
                console.log('');
            });
        } else {
            console.log('⚠️ Aucun quiz trouvé');
            
            // Debug: vérifier les données dans la base
            console.log('\n🔍 Debug: Vérification des données...');
            
            // Vérifier l'utilisateur
            console.log('👤 Utilisateur connecté:');
            console.log(`   - ID: ${user.id}`);
            console.log(`   - Classe ID: ${user.classId._id}`);
            console.log(`   - Rôle: ${user.role}`);
            
            // Vérifier les quiz dans la base
            console.log('\n📊 Vérification directe des quiz...');
            const allQuizResponse = await axios.get(`${API_BASE}/admin/quizzes`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }).catch(() => ({ data: [] }));
            
            console.log(`📝 Quiz totaux dans la base: ${allQuizResponse.data.length || 'Endpoint non disponible'}`);
        }

        // 3. Test de transformation des données (comme dans l'app mobile)
        console.log('\n🔄 Étape 3: Transformation des données...');
        const transformedQuizzes = quizResponse.data.map((quiz) => ({
            id: quiz._id || quiz.id,
            _id: quiz._id,
            title: quiz.title,
            courseId: quiz.courseId,
            course: quiz.courseId, // Le backend populate le courseId
            type: quiz.type,
            status: quiz.status,
            questions: quiz.questions || [],
            deadline: quiz.deadline,
            expiresAt: quiz.deadline, // Alias
            createdAt: quiz.createdAt,
            updatedAt: quiz.updatedAt
        }));

        console.log(`✅ ${transformedQuizzes.length} quiz transformés`);
        
        // 4. Filtrage des quiz actifs (comme dans l'app mobile)
        console.log('\n🎯 Étape 4: Filtrage des quiz actifs...');
        const now = new Date();
        const activeQuizzes = transformedQuizzes.filter(quiz => {
            if (!quiz.expiresAt && !quiz.deadline) return true;
            const expiry = quiz.expiresAt || quiz.deadline;
            return expiry ? new Date(expiry) > now : true;
        });

        console.log(`🎯 Quiz actifs: ${activeQuizzes.length}/${transformedQuizzes.length}`);

        // 5. Statistiques (comme dans l'app mobile)
        console.log('\n📊 Étape 5: Calcul des statistiques...');
        const stats = {
            completed: transformedQuizzes.filter(q => q.status === 'ARCHIVED').length,
            pending: activeQuizzes.length,
        };

        console.log(`📈 Statistiques:`);
        console.log(`   - Complétés: ${stats.completed}`);
        console.log(`   - En attente: ${stats.pending}`);

        console.log('\n🎉 TEST TERMINÉ AVEC SUCCÈS !');
        console.log('===============================');
        
        return {
            success: true,
            quizCount: quizResponse.data.length,
            activeQuizCount: activeQuizzes.length,
            stats
        };

    } catch (error) {
        console.error('❌ Erreur:', error.response?.data || error.message);
        console.error('📍 Détails:', {
            status: error.response?.status,
            url: error.config?.url,
            method: error.config?.method
        });
        
        return {
            success: false,
            error: error.message
        };
    }
}

testMobileQuizFlow();