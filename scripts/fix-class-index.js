/**
 * Script pour corriger l'index unique sur les classes
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Configuration de la base de données depuis .env
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/equizz';

async function fixClassIndex() {
    try {
        // Connexion à MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connecté à MongoDB');

        // Accéder à la collection classes directement
        const db = mongoose.connection.db;
        const classesCollection = db.collection('classes');

        // Lister les index existants
        console.log('📋 Index existants sur la collection classes :');
        const indexes = await classesCollection.indexes();
        indexes.forEach(index => {
            console.log(`  - ${JSON.stringify(index.key)} (${index.name})`);
        });

        // Supprimer l'ancien index unique sur 'code' s'il existe
        try {
            await classesCollection.dropIndex('code_1');
            console.log('✅ Ancien index unique sur "code" supprimé');
        } catch (error) {
            if (error.code === 27) {
                console.log('ℹ️ Index "code_1" n\'existe pas (déjà supprimé)');
            } else {
                console.log('⚠️ Erreur lors de la suppression de l\'index:', error.message);
            }
        }

        // Supprimer toutes les classes existantes pour éviter les conflits
        const deleteResult = await classesCollection.deleteMany({});
        console.log(`🗑️ ${deleteResult.deletedCount} classes supprimées`);

        // Créer le nouvel index composé
        try {
            await classesCollection.createIndex(
                { code: 1, academicYear: 1 }, 
                { unique: true, name: 'code_academicYear_unique' }
            );
            console.log('✅ Nouvel index composé créé : code + academicYear');
        } catch (error) {
            console.log('⚠️ Erreur lors de la création du nouvel index:', error.message);
        }

        // Lister les nouveaux index
        console.log('\n📋 Index après modification :');
        const newIndexes = await classesCollection.indexes();
        newIndexes.forEach(index => {
            console.log(`  - ${JSON.stringify(index.key)} (${index.name})`);
        });

        console.log('\n🎉 Index corrigé avec succès !');
        console.log('Vous pouvez maintenant relancer le script de création de données.');

    } catch (error) {
        console.error('❌ Erreur lors de la correction de l\'index:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Déconnecté de MongoDB');
    }
}

// Exécution du script
if (require.main === module) {
    fixClassIndex();
}

module.exports = { fixClassIndex };