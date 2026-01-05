/**
 * SCRIPT: testPassword.js
 * 
 * Script pour tester la vérification du mot de passe
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

// Configuration de la base de données
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connexion à MongoDB établie');
    } catch (error) {
        console.error('❌ Erreur de connexion à MongoDB:', error);
        process.exit(1);
    }
};

// Test du mot de passe
const testPassword = async () => {
    try {
        console.log('🔐 Test de vérification du mot de passe...\n');

        // Récupérer l'utilisateur de test
        const user = await User.findOne({ email: 'etudiant.test@institut.fr' });
        
        if (!user) {
            console.log('❌ Utilisateur non trouvé');
            return;
        }

        console.log(`👤 Utilisateur trouvé: ${user.firstName} ${user.lastName}`);
        console.log(`📧 Email: ${user.email}`);
        console.log(`🎭 Rôle: ${user.role}`);
        console.log(`🔒 Hash du mot de passe: ${user.password.substring(0, 20)}...`);

        // Test du mot de passe
        const testPassword = 'password123';
        console.log(`\n🧪 Test du mot de passe: "${testPassword}"`);
        
        // Méthode 1: Utiliser la méthode du modèle
        const isValidMethod1 = await user.matchPassword(testPassword);
        console.log(`✅ Méthode 1 (modèle): ${isValidMethod1 ? 'VALIDE' : 'INVALIDE'}`);
        
        // Méthode 2: Utiliser bcrypt directement
        const isValidMethod2 = await bcrypt.compare(testPassword, user.password);
        console.log(`✅ Méthode 2 (bcrypt): ${isValidMethod2 ? 'VALIDE' : 'INVALIDE'}`);

        // Test avec un mauvais mot de passe
        const wrongPassword = 'wrongpassword';
        const isValidWrong = await user.matchPassword(wrongPassword);
        console.log(`❌ Test mauvais mot de passe: ${isValidWrong ? 'VALIDE' : 'INVALIDE'}`);

        // Test de création d'un nouveau hash
        console.log('\n🔧 Test de création d\'un nouveau hash...');
        const newHash = await bcrypt.hash(testPassword, 10);
        console.log(`🔒 Nouveau hash: ${newHash.substring(0, 20)}...`);
        
        const isValidNewHash = await bcrypt.compare(testPassword, newHash);
        console.log(`✅ Nouveau hash valide: ${isValidNewHash ? 'OUI' : 'NON'}`);

    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
        throw error;
    }
};

// Exécution du script
const runTest = async () => {
    try {
        await connectDB();
        await testPassword();
        console.log('\n✅ Test terminé');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur fatale:', error);
        process.exit(1);
    }
};

// Exécuter si appelé directement
if (require.main === module) {
    runTest();
}

module.exports = { testPassword, connectDB };