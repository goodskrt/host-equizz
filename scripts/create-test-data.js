/**
 * Script de création de données de test pour la fonctionnalité de changement de classe
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { AcademicYear, Class } = require('../models/Academic');
const User = require('../models/User');

// Configuration de la base de données depuis .env
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/equizz';

async function createTestData() {
    try {
        // Connexion à MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connecté à MongoDB');

        // 1. Créer des années académiques
        console.log('📅 Création des années académiques...');
        
        const years = [
            { label: '2023-2024', isCurrent: false },
            { label: '2024-2025', isCurrent: true },
            { label: '2025-2026', isCurrent: false },
            { label: '2026-2027', isCurrent: false },
        ];

        const createdYears = [];
        for (const yearData of years) {
            let year = await AcademicYear.findOne({ label: yearData.label });
            if (!year) {
                year = await AcademicYear.create(yearData);
                console.log(`  ✅ Année créée: ${year.label}`);
            } else {
                console.log(`  ℹ️ Année existante: ${year.label}`);
            }
            createdYears.push(year);
        }

        // 2. Créer des classes pour chaque année
        console.log('🏫 Création des classes...');
        
        const classTemplates = [
            // Niveau 1
            { code: 'ING1-GEN-FR', speciality: 'GEN', level: 1, language: 'FR' },
            { code: 'ING1-GEN-EN', speciality: 'GEN', level: 1, language: 'EN' },
            { code: 'ING1-ISI-FR', speciality: 'ISI', level: 1, language: 'FR' },
            { code: 'ING1-ISI-EN', speciality: 'ISI', level: 1, language: 'EN' },
            
            // Niveau 2
            { code: 'ING2-GEN-FR', speciality: 'GEN', level: 2, language: 'FR' },
            { code: 'ING2-GEN-EN', speciality: 'GEN', level: 2, language: 'EN' },
            { code: 'ING2-ISI-FR', speciality: 'ISI', level: 2, language: 'FR' },
            { code: 'ING2-ISI-EN', speciality: 'ISI', level: 2, language: 'EN' },
            
            // Niveau 3
            { code: 'ING3-ISI-FR', speciality: 'ISI', level: 3, language: 'FR' },
            { code: 'ING3-ISI-EN', speciality: 'ISI', level: 3, language: 'EN' },
            { code: 'ING3-GI-FR', speciality: 'GI', level: 3, language: 'FR' },
            { code: 'ING3-GI-EN', speciality: 'GI', level: 3, language: 'EN' },
            { code: 'ING3-RT-FR', speciality: 'RT', level: 3, language: 'FR' },
            { code: 'ING3-RT-EN', speciality: 'RT', level: 3, language: 'EN' },
            
            // Niveau 4
            { code: 'ING4-ISI-FR', speciality: 'ISI', level: 4, language: 'FR' },
            { code: 'ING4-ISI-EN', speciality: 'ISI', level: 4, language: 'EN' },
            { code: 'ING4-GI-FR', speciality: 'GI', level: 4, language: 'FR' },
            { code: 'ING4-GI-EN', speciality: 'GI', level: 4, language: 'EN' },
            { code: 'ING4-RT-FR', speciality: 'RT', level: 4, language: 'FR' },
            { code: 'ING4-RT-EN', speciality: 'RT', level: 4, language: 'EN' },
            
            // Niveau 5
            { code: 'ING5-ISI-FR', speciality: 'ISI', level: 5, language: 'FR' },
            { code: 'ING5-ISI-EN', speciality: 'ISI', level: 5, language: 'EN' },
            { code: 'ING5-GI-FR', speciality: 'GI', level: 5, language: 'FR' },
            { code: 'ING5-GI-EN', speciality: 'GI', level: 5, language: 'EN' },
            { code: 'ING5-RT-FR', speciality: 'RT', level: 5, language: 'FR' },
            { code: 'ING5-RT-EN', speciality: 'RT', level: 5, language: 'EN' },
        ];

        for (const year of createdYears) {
            for (const template of classTemplates) {
                let existingClass = await Class.findOne({ 
                    code: template.code,
                    academicYear: year._id 
                });
                
                if (!existingClass) {
                    const newClass = await Class.create({
                        ...template,
                        academicYear: year._id
                    });
                    console.log(`  ✅ Classe créée: ${newClass.code} (${year.label})`);
                } else {
                    console.log(`  ℹ️ Classe existante: ${existingClass.code} (${year.label})`);
                }
            }
        }

        // 3. Créer un utilisateur de test
        console.log('👤 Création d\'un utilisateur de test...');
        
        const currentYear = createdYears.find(y => y.isCurrent);
        const testClass = await Class.findOne({ 
            code: 'ING1-GEN-FR',
            academicYear: currentYear._id 
        });

        let testUser = await User.findOne({ email: 'test.student@example.com' });
        if (!testUser) {
            testUser = await User.create({
                email: 'test.student@example.com',
                password: 'password123',
                firstName: 'Test',
                lastName: 'Student',
                matricule: 'TEST001',
                role: 'STUDENT',
                classId: testClass._id
            });
            console.log(`  ✅ Utilisateur créé: ${testUser.email} (Classe: ${testClass.code})`);
        } else {
            console.log(`  ℹ️ Utilisateur existant: ${testUser.email}`);
        }

        console.log('\n🎉 Données de test créées avec succès !');
        console.log('\nPour tester la fonctionnalité :');
        console.log('1. Connectez-vous avec : test.student@example.com / password123');
        console.log('2. Allez dans le profil et cliquez sur "Changer de classe"');
        console.log('3. Vous devriez voir les classes éligibles selon les règles implémentées');
        console.log('\nUtilisateur de test en ING1-GEN-FR (Niveau 1, spécialité GEN, langue FR)');
        console.log('Classes éligibles attendues :');
        console.log('- ING1-GEN-FR (même classe, années futures)');
        console.log('- ING2-GEN-FR (niveau 2, même spécialité + langue)');
        console.log('Classes NON éligibles :');
        console.log('- ING2-GEN-EN (langue différente)');
        console.log('- ING2-ISI-FR (spécialité différente)');
        console.log('- ING3-* (saut de niveau non autorisé)');

    } catch (error) {
        console.error('❌ Erreur lors de la création des données de test:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Déconnecté de MongoDB');
    }
}

// Exécution du script
if (require.main === module) {
    createTestData();
}

module.exports = { createTestData };