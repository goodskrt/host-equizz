/**
 * Script pour ajouter l'utilisateur IGRE URBAIN LEPONTIFE
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const { Class, AcademicYear } = require('../models/Academic');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/equizz';

async function addIgreUser() {
    try {
        // Connexion à MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connecté à MongoDB');

        console.log('\n👤 AJOUT DE L\'UTILISATEUR IGRE URBAIN LEPONTIFE...');

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findOne({ 
            $or: [
                { email: 'urbain.igre@saintjeaningenieur.org' },
                { matricule: '2223i278' }
            ]
        });

        if (existingUser) {
            console.log('⚠️  Utilisateur déjà existant, suppression...');
            await User.deleteOne({ _id: existingUser._id });
            console.log('🗑️  Ancien utilisateur supprimé');
        }

        // Trouver l'année académique courante
        const currentYear = await AcademicYear.findOne({ isCurrent: true });
        if (!currentYear) {
            throw new Error('Aucune année académique courante trouvée');
        }

        // Trouver une classe ISI niveau 4 (basé sur le matricule qui semble être ISI)
        const igreClass = await Class.findOne({ 
            code: 'ING4-ISI-FR',
            academicYear: currentYear._id
        });

        if (!igreClass) {
            throw new Error('Classe ING4-ISI-FR non trouvée pour l\'année courante');
        }

        // Créer l'utilisateur IGRE
        const igreUser = await User.create({
            email: 'urbain.igre@saintjeaningenieur.org',
            firstName: 'IGRE URBAIN',
            lastName: 'LEPONTIFE',
            matricule: '2223i278',
            password: '12345678',
            role: 'STUDENT',
            classId: igreClass._id
        });

        console.log('✅ Utilisateur IGRE créé avec succès !');
        console.log('=====================================');
        console.log(`📧 Email: ${igreUser.email}`);
        console.log(`👤 Nom: ${igreUser.firstName} ${igreUser.lastName}`);
        console.log(`🆔 Matricule: ${igreUser.matricule}`);
        console.log(`🔑 Mot de passe: 12345678`);
        console.log(`🎭 Rôle: ${igreUser.role}`);
        console.log(`🏫 Classe: ${igreClass.code} (${igreClass.speciality} niveau ${igreClass.level})`);
        console.log(`📅 Année: ${currentYear.label}`);

        // Test de l'authentification
        console.log('\n🧪 TEST D\'AUTHENTIFICATION...');
        const testUser = await User.findOne({ email: 'urbain.igre@saintjeaningenieur.org' });
        const isPasswordValid = await testUser.matchPassword('12345678');
        
        if (isPasswordValid) {
            console.log('✅ Test d\'authentification réussi');
        } else {
            console.log('❌ Échec du test d\'authentification');
        }

        console.log('\n🎯 INFORMATIONS DE CONNEXION:');
        console.log('Email: urbain.igre@saintjeaningenieur.org');
        console.log('Mot de passe: 12345678');
        console.log('Matricule (pour scan carte): 2223i278');

    } catch (error) {
        console.error('❌ Erreur lors de l\'ajout de l\'utilisateur:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Déconnecté de MongoDB');
    }
}

// Exécution du script
if (require.main === module) {
    addIgreUser();
}

module.exports = { addIgreUser };