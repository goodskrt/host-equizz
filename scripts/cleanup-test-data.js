/**
 * Script de nettoyage des données de test créées par le seed précédent
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { AcademicYear, Class } = require('../models/Academic');
const User = require('../models/User');

// Configuration de la base de données depuis .env
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/equizz';

async function cleanupTestData() {
    try {
        // Connexion à MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connecté à MongoDB');

        // 1. Supprimer l'utilisateur de test
        console.log('👤 Suppression de l\'utilisateur de test...');
        const deletedUser = await User.deleteOne({ email: 'test.student@example.com' });
        if (deletedUser.deletedCount > 0) {
            console.log('  ✅ Utilisateur de test supprimé');
        } else {
            console.log('  ℹ️ Aucun utilisateur de test trouvé');
        }

        // 2. Supprimer TOUTES les classes existantes pour repartir à zéro
        console.log('🏫 Suppression de toutes les classes existantes...');
        const allClasses = await Class.find({});
        console.log(`  📊 ${allClasses.length} classes trouvées`);
        
        await Class.deleteMany({});
        console.log('  ✅ Toutes les classes supprimées');

        // 3. Supprimer les années académiques créées (sauf 2024-2025 qui existait déjà)
        console.log('📅 Suppression des années académiques créées...');
        const yearsToDelete = ['2023-2024', '2025-2026', '2026-2027'];
        
        for (const yearLabel of yearsToDelete) {
            const deletedYear = await AcademicYear.deleteOne({ label: yearLabel });
            if (deletedYear.deletedCount > 0) {
                console.log(`  ✅ Année supprimée: ${yearLabel}`);
            } else {
                console.log(`  ℹ️ Année non trouvée: ${yearLabel}`);
            }
        }

        console.log('\n🧹 Nettoyage terminé avec succès !');
        console.log('Les données du seed précédent ont été supprimées.');

    } catch (error) {
        console.error('❌ Erreur lors du nettoyage:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Déconnecté de MongoDB');
    }
}

// Exécution du script
if (require.main === module) {
    cleanupTestData();
}

module.exports = { cleanupTestData };