/**
 * Script pour tester l'authentification avec le bon mot de passe
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function testPasswordAuth() {
    try {
        console.log('🔗 Connexion à MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connecté à MongoDB');

        // Trouver l'étudiant 2223i278
        const student = await User.findOne({ matricule: '2223i278' });
        if (!student) {
            console.log('❌ Étudiant 2223i278 non trouvé');
            return;
        }

        console.log('👤 Étudiant trouvé:', student.firstName, student.lastName);
        console.log('📧 Email:', student.email);
        console.log('🆔 Matricule:', student.matricule);

        // Test du mot de passe
        const testPassword = 'password123';
        console.log(`\n🧪 Test du mot de passe: "${testPassword}"`);
        
        const isPasswordValid = await student.matchPassword(testPassword);
        console.log('✅ Mot de passe valide:', isPasswordValid);

        if (isPasswordValid) {
            console.log('🎯 L\'authentification devrait fonctionner avec ces identifiants:');
            console.log(`   - Identifier: ${student.matricule} ou ${student.email}`);
            console.log(`   - Password: ${testPassword}`);
        } else {
            console.log('❌ Le mot de passe ne correspond pas');
            
            // Vérifier le hash stocké
            console.log('\n🔍 Debug du hash:');
            console.log('Hash stocké:', student.password);
            
            // Tester manuellement le hash
            const manualCheck = await bcrypt.compare(testPassword, student.password);
            console.log('Vérification manuelle bcrypt:', manualCheck);
        }

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Déconnecté de MongoDB');
    }
}

testPasswordAuth();