/**
 * SCRIPT: seedEvaluationData.js
 * 
 * Script pour remplir la base de données avec des données de test
 * pour le système d'évaluation des cours
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Modèles
const User = require('../models/User');
const { AcademicYear, Class, Course } = require('../models/Academic');

// Configuration de la base de données
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connexion à MongoDB établie');
    } catch (error) {
        console.error('❌ Erreur de connexion à MongoDB:', error);
        process.exit(1);
    }
};

// Données de test
const seedData = async () => {
    try {
        console.log('🌱 Début du seeding des données d\'évaluation...');

        // 1. Nettoyer les données existantes
        console.log('🧹 Nettoyage des données existantes...');
        await User.deleteMany({});
        await Course.deleteMany({});
        await Class.deleteMany({});
        await AcademicYear.deleteMany({});

        // 2. Créer l'année académique
        console.log('📅 Création de l\'année académique...');
        const academicYear = await AcademicYear.create({
            label: '2024-2025',
            isCurrent: true
        });

        // 3. Créer la classe ING4-ISI-FR
        console.log('🎓 Création de la classe...');
        const classData = await Class.create({
            code: 'ING4-ISI-FR',
            speciality: 'ISI',
            level: 4,
            language: 'FR',
            academicYear: academicYear._id
        });

        // 4. Créer les cours réalistes
        console.log('📚 Création des cours...');
        const courses = [
            {
                code: 'ISI4217',
                name: 'Développement Mobile',
                classId: classData._id,
                semester: 1
            },
            {
                code: 'ISI4218',
                name: 'Intelligence Artificielle',
                classId: classData._id,
                semester: 1
            },
            {
                code: 'ISI4219',
                name: 'Sécurité Informatique',
                classId: classData._id,
                semester: 2
            },
            {
                code: 'ISI4220',
                name: 'Base de Données Avancées',
                classId: classData._id,
                semester: 2
            },
            {
                code: 'ISI4221',
                name: 'Génie Logiciel',
                classId: classData._id,
                semester: 1
            },
            {
                code: 'ISI4222',
                name: 'Réseaux et Télécommunications',
                classId: classData._id,
                semester: 2
            },
            {
                code: 'ISI4223',
                name: 'Architecture des Systèmes',
                classId: classData._id,
                semester: 1
            },
            {
                code: 'ISI4224',
                name: 'Machine Learning',
                classId: classData._id,
                semester: 2
            },
            {
                code: 'ISI4225',
                name: 'Développement Web Avancé',
                classId: classData._id,
                semester: 1
            },
            {
                code: 'ISI4226',
                name: 'Cloud Computing',
                classId: classData._id,
                semester: 2
            }
        ];

        const createdCourses = await Course.insertMany(courses);
        console.log(`✅ ${createdCourses.length} cours créés`);

        // 5. Créer des utilisateurs de test
        console.log('👥 Création des utilisateurs de test...');
        
        // Un seul admin
        const admin = await User.create({
            email: 'admin@institut.fr',
            firstName: 'Admin',
            lastName: 'Système',
            password: 'password123', // Le middleware pre('save') va hasher automatiquement
            role: 'ADMIN'
        });

        // Étudiant de test principal
        const testStudent = await User.create({
            email: 'etudiant.test@institut.fr',
            firstName: 'Étudiant',
            lastName: 'Test',
            matricule: '2024i001',
            password: 'password123', // Le middleware pre('save') va hasher automatiquement
            role: 'STUDENT',
            classId: classData._id
        });

        console.log(`✅ 1 admin créé`);
        console.log(`✅ 1 étudiant principal créé`);

        // 6. Créer des étudiants supplémentaires pour la classe
        console.log('👨‍🎓 Création d\'étudiants supplémentaires...');
        const createdStudents = [];
        for (let i = 2; i <= 25; i++) {
            const student = await User.create({
                email: `etudiant${i}@institut.fr`,
                firstName: `Étudiant`,
                lastName: `${i}`,
                matricule: `2024i${i.toString().padStart(3, '0')}`,
                password: 'password123', // Le middleware pre('save') va hasher automatiquement
                role: 'STUDENT',
                classId: classData._id
            });
            createdStudents.push(student);
        }

        console.log(`✅ ${createdStudents.length} étudiants supplémentaires créés`);

        // 7. Afficher le résumé
        console.log('\n🎉 Seeding terminé avec succès !');
        console.log('=====================================');
        console.log(`📅 Année académique: ${academicYear.label}`);
        console.log(`🎓 Classe: ${classData.code}`);
        console.log(`📚 Cours: ${createdCourses.length}`);
        console.log(`👥 Utilisateurs: ${1 + 1 + createdStudents.length} (1 admin + ${1 + createdStudents.length} étudiants)`);
        console.log('=====================================');
        console.log('\n📋 Comptes de test créés:');
        console.log(`👨‍💼 Admin: admin@institut.fr / password123`);
        console.log(`👨‍� Étudianat: etudiant.test@institut.fr / password123`);
        console.log(`�‍🎓 Autpres étudiants: etudiant2@institut.fr à etudiant25@institut.fr / password123`);
        console.log('\n🔗 L\'application mobile peut maintenant récupérer les évaluations via l\'API');

    } catch (error) {
        console.error('❌ Erreur lors du seeding:', error);
        throw error;
    }
};

// Exécution du script
const runSeed = async () => {
    try {
        await connectDB();
        await seedData();
        console.log('\n✅ Script terminé avec succès');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur fatale:', error);
        process.exit(1);
    }
};

// Exécuter si appelé directement
if (require.main === module) {
    runSeed();
}

module.exports = { seedData, connectDB };