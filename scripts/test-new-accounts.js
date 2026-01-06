/**
 * Script de test des nouveaux comptes créés
 * Teste l'authentification avec les comptes de la base minimale
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const { Class } = require('../models/Academic');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/equizz';

async function testNewAccounts() {
    try {
        // Connexion à MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connecté à MongoDB');

        console.log('\n🧪 TEST DES COMPTES CRÉÉS...');

        // Comptes à tester
        const testAccounts = [
            { email: 'admin@institut.fr', password: 'password123', expectedRole: 'ADMIN' },
            { email: 'etudiant.isi@institut.fr', password: 'password123', expectedRole: 'STUDENT' },
            { email: 'etudiant.srt@institut.fr', password: 'password123', expectedRole: 'STUDENT' },
            { email: 'etudiant.gen@institut.fr', password: 'password123', expectedRole: 'STUDENT' },
            { email: 'etudiant.gc@institut.fr', password: 'password123', expectedRole: 'STUDENT' },
            { email: 'urbain.igre@saintjeaningenieur.org', password: '12345678', expectedRole: 'STUDENT' }
        ];

        for (const account of testAccounts) {
            console.log(`\n🔍 Test de ${account.email}...`);
            
            // Trouver l'utilisateur
            const user = await User.findOne({ email: account.email }).populate('classId');
            
            if (!user) {
                console.log(`   ❌ Utilisateur non trouvé`);
                continue;
            }

            // Vérifier le rôle
            if (user.role !== account.expectedRole) {
                console.log(`   ❌ Rôle incorrect: attendu ${account.expectedRole}, trouvé ${user.role}`);
                continue;
            }

            // Tester le mot de passe
            const isPasswordValid = await user.matchPassword(account.password);
            if (!isPasswordValid) {
                console.log(`   ❌ Mot de passe incorrect`);
                continue;
            }

            // Afficher les informations
            console.log(`   ✅ Authentification réussie`);
            console.log(`   📧 Email: ${user.email}`);
            console.log(`   👤 Nom: ${user.firstName} ${user.lastName}`);
            console.log(`   🎭 Rôle: ${user.role}`);
            
            if (user.matricule) {
                console.log(`   🆔 Matricule: ${user.matricule}`);
            }
            
            if (user.classId) {
                console.log(`   🏫 Classe: ${user.classId.code} (${user.classId.speciality} niveau ${user.classId.level})`);
            }
        }

        console.log('\n✅ TESTS TERMINÉS');

    } catch (error) {
        console.error('❌ Erreur lors des tests:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Déconnecté de MongoDB');
    }
}

// Exécution du script
if (require.main === module) {
    testNewAccounts();
}

module.exports = { testNewAccounts };