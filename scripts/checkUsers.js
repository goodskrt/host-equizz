/**
 * Script simple pour vérifier les utilisateurs dans la base de données
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function checkUsers() {
    try {
        console.log('🔗 Connexion à MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connecté à MongoDB');

        // Compter les utilisateurs
        const userCount = await User.countDocuments();
        console.log('👥 Nombre total d\'utilisateurs:', userCount);

        // Trouver l'étudiant 2223i278
        const student = await User.findOne({ matricule: '2223i278' });
        if (student) {
            console.log('👤 Étudiant 2223i278 trouvé:');
            console.log('  - ID:', student._id);
            console.log('  - Email:', student.email);
            console.log('  - Nom:', student.firstName, student.lastName);
            console.log('  - Matricule:', student.matricule);
            console.log('  - Rôle:', student.role);
            console.log('  - ClassId:', student.classId);
        } else {
            console.log('❌ Étudiant 2223i278 non trouvé');
            
            // Lister quelques utilisateurs pour debug
            const someUsers = await User.find().limit(5).select('matricule email firstName lastName');
            console.log('📋 Quelques utilisateurs dans la base:');
            someUsers.forEach(user => {
                console.log(`  - ${user.matricule}: ${user.firstName} ${user.lastName} (${user.email})`);
            });
        }

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Déconnecté de MongoDB');
    }
}

checkUsers();