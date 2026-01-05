/**
 * Script de debug pour comprendre exactement ce que retourne l'API submissions
 */

const axios = require('axios');

async function debugSubmissionsAPI() {
    try {
        console.log('🔍 Debug de l\'API submissions...');
        
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
        console.log('✅ Token obtenu');
        
        // 2. Test de l'endpoint submissions avec debug détaillé
        console.log('\n📋 Test de /student/submissions...');
        
        try {
            const submissionsResponse = await axios.get(`${baseURL}/student/submissions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            console.log('📊 RÉPONSE COMPLÈTE:');
            console.log('Status HTTP:', submissionsResponse.status);
            console.log('Headers:', submissionsResponse.headers['content-type']);
            console.log('Data type:', typeof submissionsResponse.data);
            console.log('Data is array:', Array.isArray(submissionsResponse.data));
            console.log('Data keys:', Object.keys(submissionsResponse.data || {}));
            console.log('Data content:', JSON.stringify(submissionsResponse.data, null, 2));
            
            // Analyser la structure
            const data = submissionsResponse.data;
            
            if (data.success && data.data) {
                console.log('\n✅ Structure: {success: true, data: [...]}');
                console.log('data.data type:', typeof data.data);
                console.log('data.data is array:', Array.isArray(data.data));
                console.log('data.data length:', data.data.length);
                
                if (Array.isArray(data.data) && data.data.length > 0) {
                    console.log('Premier élément:', JSON.stringify(data.data[0], null, 2));
                }
            } else if (Array.isArray(data)) {
                console.log('\n✅ Structure: [...] (tableau direct)');
                console.log('Length:', data.length);
                if (data.length > 0) {
                    console.log('Premier élément:', JSON.stringify(data[0], null, 2));
                }
            } else {
                console.log('\n❌ Structure inattendue');
            }
            
        } catch (apiError) {
            console.error('❌ Erreur API submissions:', apiError.response?.status, apiError.response?.data);
        }
        
        // 3. Pour comparaison, tester l'endpoint quiz
        console.log('\n📝 Test de /student/quizzes pour comparaison...');
        
        try {
            const quizzesResponse = await axios.get(`${baseURL}/student/quizzes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            console.log('📊 QUIZ RESPONSE:');
            console.log('Status HTTP:', quizzesResponse.status);
            console.log('Data type:', typeof quizzesResponse.data);
            console.log('Data is array:', Array.isArray(quizzesResponse.data));
            console.log('Data length:', quizzesResponse.data?.length || 'N/A');
            
        } catch (apiError) {
            console.error('❌ Erreur API quiz:', apiError.response?.status, apiError.response?.data);
        }
        
    } catch (error) {
        console.error('❌ Erreur générale:', error.message);
    }
}

debugSubmissionsAPI();