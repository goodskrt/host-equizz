/**
 * Script pour vérifier l'utilisateur de test et sa classe
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { AcademicYear, Class } = require('../models/Academic');
const User = require('../models/User');

// Configuration de la base de données depuis .env
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/equizz';

async function checkTestUser() {
    try {
        // Connexion à MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connecté à MongoDB');

        // Vérifier l'utilisateur de test
        const testUser = await User.findOne({ email: 'test.student@example.com' }).populate({
            path: 'classId',
            populate: {
                path: 'academicYear'
            }
        });

        if (!testUser) {
            console.log('❌ Utilisateur de test non trouvé');
            return;
        }

        console.log('👤 Utilisateur de test trouvé :');
        console.log(`  - Email: ${testUser.email}`);
        console.log(`  - Nom: ${testUser.firstName} ${testUser.lastName}`);
        console.log(`  - Matricule: ${testUser.matricule}`);
        console.log(`  - Rôle: ${testUser.role}`);
        console.log(`  - Classe ID: ${testUser.classId?._id}`);

        if (testUser.classId) {
            console.log('🏫 Classe actuelle :');
            console.log(`  - Code: ${testUser.classId.code}`);
            console.log(`  - Spécialité: ${testUser.classId.speciality}`);
            console.log(`  - Niveau: ${testUser.classId.level}`);
            console.log(`  - Langue: ${testUser.classId.language}`);
            console.log(`  - Année académique: ${testUser.classId.academicYear?.label}`);
        } else {
            console.log('❌ Aucune classe assignée');
        }

        // Vérifier les années académiques
        console.log('\n📅 Années académiques disponibles :');
        const years = await AcademicYear.find().sort({ label: 1 });
        years.forEach(year => {
            console.log(`  - ${year.label} ${year.isCurrent ? '(courante)' : ''}`);
        });

        // Vérifier les classes pour l'année courante
        const currentYear = years.find(y => y.isCurrent);
        if (currentYear) {
            console.log(`\n🏫 Classes disponibles pour l'année courante (${currentYear.label}) :`);
            const currentClasses = await Class.find({ academicYear: currentYear._id }).sort({ code: 1 });
            currentClasses.forEach(classe => {
                console.log(`  - ${classe.code} (${classe.speciality}, niveau ${classe.level}, ${classe.language})`);
            });
        }

        // Vérifier l'année suivante
        const nextYear = await AcademicYear.findOne({
            label: { $gt: currentYear.label }
        }).sort({ label: 1 });

        if (nextYear) {
            console.log(`\n🔮 Année suivante trouvée: ${nextYear.label}`);
            const nextYearClasses = await Class.find({ academicYear: nextYear._id }).sort({ code: 1 });
            console.log(`📊 ${nextYearClasses.length} classes disponibles pour l'année suivante`);
            
            // Afficher quelques exemples
            console.log('Exemples de classes pour l\'année suivante :');
            nextYearClasses.slice(0, 5).forEach(classe => {
                console.log(`  - ${classe.code} (${classe.speciality}, niveau ${classe.level}, ${classe.language})`);
            });
        } else {
            console.log('\n❌ Aucune année suivante trouvée');
        }

    } catch (error) {
        console.error('❌ Erreur lors de la vérification:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Déconnecté de MongoDB');
    }
}

// Exécution du script
if (require.main === module) {
    checkTestUser();
}

module.exports = { checkTestUser };