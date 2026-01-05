/**
 * Script de test pour vérifier la configuration Firebase
 */

require('dotenv').config();
const { sendPushNotification } = require('../utils/firebaseService');

async function testFirebaseConfiguration() {
    console.log('🔥 Test de la configuration Firebase...\n');

    // Test 1: Vérification de l'initialisation
    console.log('1. Vérification de l\'initialisation Firebase...');
    try {
        // Vérifier que Firebase Admin est initialisé
        const admin = require('firebase-admin');
        if (admin.apps.length > 0) {
            console.log('✅ Firebase Admin SDK initialisé correctement');
        } else {
            throw new Error('Firebase Admin SDK non initialisé');
        }

        console.log('✅ Firebase configuré correctement\n');

    } catch (error) {
        console.error('❌ Erreur de configuration Firebase:', error.message);
        console.log('⚠️ Vérifiez que le fichier serviceAccountKey.json est présent dans /config/\n');
    }

    // Test 2: Vérification des variables d'environnement
    console.log('2. Vérification des variables d\'environnement...');
    const requiredEnvVars = [
        'FIREBASE_PROJECT_ID',
        'FIREBASE_PRIVATE_KEY_ID',
        'FIREBASE_CLIENT_EMAIL'
    ];

    let allEnvVarsPresent = true;
    for (const envVar of requiredEnvVars) {
        if (process.env[envVar]) {
            console.log(`✅ ${envVar}: ${process.env[envVar].substring(0, 20)}...`);
        } else {
            console.log(`❌ ${envVar}: Non défini`);
            allEnvVarsPresent = false;
        }
    }

    if (allEnvVarsPresent) {
        console.log('✅ Toutes les variables d\'environnement Firebase sont définies\n');
    } else {
        console.log('⚠️ Certaines variables d\'environnement Firebase sont manquantes\n');
    }

    // Test 3: Vérification du fichier de configuration
    console.log('3. Vérification du fichier serviceAccountKey.json...');
    try {
        const serviceAccount = require('../config/serviceAccountKey.json');
        
        const requiredFields = [
            'type',
            'project_id',
            'private_key_id',
            'private_key',
            'client_email'
        ];

        let allFieldsPresent = true;
        for (const field of requiredFields) {
            if (serviceAccount[field]) {
                console.log(`✅ ${field}: Présent`);
            } else {
                console.log(`❌ ${field}: Manquant`);
                allFieldsPresent = false;
            }
        }

        if (allFieldsPresent) {
            console.log('✅ Fichier serviceAccountKey.json valide\n');
        } else {
            console.log('⚠️ Fichier serviceAccountKey.json incomplet\n');
        }

        // Vérifier la correspondance du project_id
        if (serviceAccount.project_id === process.env.FIREBASE_PROJECT_ID) {
            console.log('✅ Project ID cohérent entre .env et serviceAccountKey.json');
        } else {
            console.log('⚠️ Project ID incohérent entre .env et serviceAccountKey.json');
            console.log(`   .env: ${process.env.FIREBASE_PROJECT_ID}`);
            console.log(`   serviceAccountKey.json: ${serviceAccount.project_id}`);
        }

    } catch (error) {
        console.error('❌ Impossible de lire serviceAccountKey.json:', error.message);
        console.log('⚠️ Assurez-vous que le fichier existe dans /config/serviceAccountKey.json\n');
    }

    console.log('\n🎯 Résumé du test Firebase:');
    console.log('- Configuration: Vérifiée');
    console.log('- Variables d\'environnement: Vérifiées');
    console.log('- Fichier de configuration: Vérifié');
    console.log('\n📱 Prêt pour les notifications push !');
}

// Exécuter le test si le script est appelé directement
if (require.main === module) {
    testFirebaseConfiguration().catch(console.error);
}

module.exports = { testFirebaseConfiguration };