/**
 * Script pour vérifier les utilisateurs administrateurs
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/equizz';

async function checkAdminUsers() {
    try {
        // Connexion à MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connecté à MongoDB');

        console.log('\n👥 VÉRIFICATION DES UTILISATEURS ADMINISTRATEURS...');

        // Récupérer tous les utilisateurs admin
        const adminUsers = await User.find({ role: 'ADMIN' });

        console.log(`📊 Nombre d'administrateurs trouvés: ${adminUsers.length}`);

        if (adminUsers.length > 0) {
            console.log('\n👤 LISTE DES ADMINISTRATEURS:');
            console.log('=====================================');
            
            adminUsers.forEach((admin, index) => {
                console.log(`\n${index + 1}. ${admin.firstName} ${admin.lastName}`);
                console.log(`   📧 Email: ${admin.email}`);
                console.log(`   🆔 ID: ${admin._id}`);
                console.log(`   📅 Créé le: ${admin.createdAt}`);
                console.log(`   🔄 Modifié le: ${admin.updatedAt}`);
            });
        } else {
            console.log('⚠️  Aucun administrateur trouvé');
        }

        // Vérifier spécifiquement l'admin Denis
        console.log('\n🔍 VÉRIFICATION SPÉCIFIQUE DE L\'ADMIN DENIS...');
        const denisAdmin = await User.findOne({ email: 'denis@institutsaintjean.org' });
        
        if (denisAdmin) {
            console.log('✅ Admin Denis trouvé !');
            console.log(`   👤 Nom complet: ${denisAdmin.firstName} ${denisAdmin.lastName}`);
            console.log(`   📧 Email: ${denisAdmin.email}`);
            console.log(`   🎭 Rôle: ${denisAdmin.role}`);
            console.log(`   🆔 ID: ${denisAdmin._id}`);
            
            // Test du mot de passe
            const isPasswordValid = await denisAdmin.matchPassword('admin123');
            console.log(`   🔑 Mot de passe valide: ${isPasswordValid ? '✅ Oui' : '❌ Non'}`);
        } else {
            console.log('❌ Admin Denis non trouvé');
        }

    } catch (error) {
        console.error('❌ Erreur lors de la vérification:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Déconnecté de MongoDB');
    }
}

// Exécution du script
if (require.main === module) {
    checkAdminUsers();
}

module.exports = { checkAdminUsers };