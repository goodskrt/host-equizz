/**
 * Script pour ajouter l'administrateur Denis
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/equizz';

async function addAdminDenis() {
    try {
        // Connexion à MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connecté à MongoDB');

        console.log('\n👤 AJOUT DE L\'ADMINISTRATEUR DENIS...');

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findOne({ 
            email: 'denis@institutsaintjean.org'
        });

        if (existingUser) {
            console.log('⚠️  Utilisateur déjà existant, suppression...');
            await User.deleteOne({ _id: existingUser._id });
            console.log('🗑️  Ancien utilisateur supprimé');
        }

        // Créer l'administrateur Denis
        const adminUser = await User.create({
            email: 'denis@institutsaintjean.org',
            firstName: 'Admin',
            lastName: 'denis',
            password: 'admin123',
            role: 'ADMIN'
            // Pas de matricule ni de classId pour un admin
        });

        console.log('✅ Administrateur Denis créé avec succès !');
        console.log('=====================================');
        console.log(`📧 Email: ${adminUser.email}`);
        console.log(`👤 Nom: ${adminUser.firstName} ${adminUser.lastName}`);
        console.log(`🔑 Mot de passe: admin123`);
        console.log(`🎭 Rôle: ${adminUser.role}`);

        // Test de l'authentification
        console.log('\n🧪 TEST D\'AUTHENTIFICATION...');
        const testUser = await User.findOne({ email: 'denis@institutsaintjean.org' });
        const isPasswordValid = await testUser.matchPassword('admin123');
        
        if (isPasswordValid) {
            console.log('✅ Test d\'authentification réussi');
        } else {
            console.log('❌ Échec du test d\'authentification');
        }

        console.log('\n🎯 INFORMATIONS DE CONNEXION:');
        console.log('Email: denis@institutsaintjean.org');
        console.log('Mot de passe: admin123');
        console.log('Rôle: ADMIN');

    } catch (error) {
        console.error('❌ Erreur lors de l\'ajout de l\'administrateur:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Déconnecté de MongoDB');
    }
}

// Exécution du script
if (require.main === module) {
    addAdminDenis();
}

module.exports = { addAdminDenis };