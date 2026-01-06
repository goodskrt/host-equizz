/**
 * Script minimal pour vider et repeupler la base de données
 * Crée uniquement les filières ISI, SRT, GEN, GC pour 2024-2025 et 2025-2026
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

// Modèles
const User = require('../models/User');
const { AcademicYear, Class, Course, Semester } = require('../models/Academic');
const { Quiz } = require('../models/Quiz');
const { Submission, SubmissionLog } = require('../models/Submission');
const PasswordReset = require('../models/PasswordReset');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/equizz';

async function resetMinimalDatabase() {
    try {
        // Connexion à MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connecté à MongoDB');

        // ========================================
        // 1. NETTOYAGE COMPLET DE LA BASE
        // ========================================
        console.log('\n🧹 NETTOYAGE COMPLET DE LA BASE DE DONNÉES...');
        
        await PasswordReset.deleteMany({});
        console.log('  ✅ PasswordReset vidé');
        
        await SubmissionLog.deleteMany({});
        console.log('  ✅ SubmissionLog vidé');
        
        await Submission.deleteMany({});
        console.log('  ✅ Submission vidé');
        
        await Quiz.deleteMany({});
        console.log('  ✅ Quiz vidé');
        
        await Course.deleteMany({});
        console.log('  ✅ Course vidé');
        
        await Semester.deleteMany({});
        console.log('  ✅ Semester vidé');
        
        await User.deleteMany({});
        console.log('  ✅ User vidé');
        
        await Class.deleteMany({});
        console.log('  ✅ Class vidé');
        
        await AcademicYear.deleteMany({});
        console.log('  ✅ AcademicYear vidé');

        console.log('🗑️ Base de données complètement vidée');

        // ========================================
        // 2. CRÉATION DES ANNÉES ACADÉMIQUES
        // ========================================
        console.log('\n📅 CRÉATION DES ANNÉES ACADÉMIQUES...');
        
        const years = [
            { label: '2024-2025', isCurrent: true },
            { label: '2025-2026', isCurrent: false }
        ];

        const createdYears = [];
        for (const yearData of years) {
            const year = await AcademicYear.create(yearData);
            createdYears.push(year);
            console.log(`  ✅ Année créée: ${year.label} ${year.isCurrent ? '(courante)' : ''}`);
        }

        // ========================================
        // 3. CRÉATION DES CLASSES MINIMALES
        // ========================================
        console.log('\n🏫 CRÉATION DES CLASSES (ISI, SRT, GEN, GC uniquement)...');
        
        // Filières demandées : ISI, SRT, GEN, GC
        const specialities = ['ISI', 'SRT', 'GEN', 'GC'];
        const levels = [1, 2, 3, 4, 5];
        const languages = ['FR', 'EN'];
        
        const classTemplates = [];
        
        for (const speciality of specialities) {
            for (const level of levels) {
                for (const language of languages) {
                    classTemplates.push({
                        code: `ING${level}-${speciality}-${language}`,
                        speciality: speciality,
                        level: level,
                        language: language
                    });
                }
            }
        }

        const createdClasses = [];
        for (const year of createdYears) {
            for (const template of classTemplates) {
                const newClass = await Class.create({
                    ...template,
                    academicYear: year._id
                });
                createdClasses.push(newClass);
                console.log(`  ✅ Classe créée: ${newClass.code} (${year.label})`);
            }
        }

        console.log(`📊 Total: ${createdClasses.length} classes créées`);

        // ========================================
        // 4. CRÉATION DES SEMESTRES
        // ========================================
        console.log('\n📅 CRÉATION DES SEMESTRES...');
        
        const currentYear = createdYears.find(y => y.isCurrent);
        
        const semesters = [
            {
                number: 1,
                label: 'Semestre 1',
                academicYear: currentYear._id,
                startDate: new Date('2024-09-01'),
                endDate: new Date('2025-01-31')
            },
            {
                number: 2,
                label: 'Semestre 2',
                academicYear: currentYear._id,
                startDate: new Date('2025-02-01'),
                endDate: new Date('2025-06-30')
            }
        ];

        const createdSemesters = [];
        for (const semesterData of semesters) {
            const semester = await Semester.create(semesterData);
            createdSemesters.push(semester);
            console.log(`  ✅ Semestre créé: ${semester.label} (${currentYear.label})`);
        }

        // ========================================
        // 5. CRÉATION DES COURS (quelques exemples)
        // ========================================
        console.log('\n📚 CRÉATION DE QUELQUES COURS D\'EXEMPLE...');
        
        // Trouver une classe ISI niveau 4 de l'année courante
        const mainClass = createdClasses.find(c => 
            c.code === 'ING4-ISI-FR' && 
            c.academicYear.toString() === currentYear._id.toString()
        );

        const courses = [
            { code: 'ISI4217', name: 'Développement Mobile', credits: 3, teacher: 'Prof. Martin' },
            { code: 'ISI4218', name: 'Intelligence Artificielle', credits: 4, teacher: 'Prof. Dubois' },
            { code: 'ISI4219', name: 'Sécurité Informatique', credits: 3, teacher: 'Prof. Bernard' },
            { code: 'GEN4101', name: 'Mathématiques Appliquées', credits: 4, teacher: 'Prof. Leroy' },
            { code: 'SRT4301', name: 'Réseaux et Télécoms', credits: 3, teacher: 'Prof. Moreau' }
        ];

        const createdCourses = [];
        for (const courseData of courses) {
            const course = await Course.create({
                ...courseData,
                classId: mainClass._id,
                semesterId: createdSemesters[0]._id // Premier semestre
            });
            createdCourses.push(course);
            console.log(`  ✅ Cours créé: ${course.code} - ${course.name}`);
        }

        // ========================================
        // 6. CRÉATION DES UTILISATEURS
        // ========================================
        console.log('\n👥 CRÉATION DES UTILISATEURS...');

        // Admin
        const admin = await User.create({
            email: 'admin@institut.fr',
            firstName: 'Admin',
            lastName: 'Système',
            password: 'password123',
            role: 'ADMIN'
        });
        console.log(`  ✅ Admin créé: ${admin.email}`);

        // Étudiant principal ISI
        const studentISI = await User.create({
            email: 'etudiant.isi@institut.fr',
            firstName: 'Jean',
            lastName: 'DUPONT',
            matricule: '2024ISI001',
            password: 'password123',
            role: 'STUDENT',
            classId: mainClass._id
        });
        console.log(`  ✅ Étudiant ISI créé: ${studentISI.email} (${mainClass.code})`);

        // Étudiant SRT
        const srtClass = createdClasses.find(c => 
            c.code === 'ING4-SRT-FR' && 
            c.academicYear.toString() === currentYear._id.toString()
        );
        const studentSRT = await User.create({
            email: 'etudiant.srt@institut.fr',
            firstName: 'Marie',
            lastName: 'MARTIN',
            matricule: '2024SRT001',
            password: 'password123',
            role: 'STUDENT',
            classId: srtClass._id
        });
        console.log(`  ✅ Étudiant SRT créé: ${studentSRT.email} (${srtClass.code})`);

        // Étudiant GEN
        const genClass = createdClasses.find(c => 
            c.code === 'ING3-GEN-FR' && 
            c.academicYear.toString() === currentYear._id.toString()
        );
        const studentGEN = await User.create({
            email: 'etudiant.gen@institut.fr',
            firstName: 'Pierre',
            lastName: 'BERNARD',
            matricule: '2024GEN001',
            password: 'password123',
            role: 'STUDENT',
            classId: genClass._id
        });
        console.log(`  ✅ Étudiant GEN créé: ${studentGEN.email} (${genClass.code})`);

        // Étudiant GC
        const gcClass = createdClasses.find(c => 
            c.code === 'ING4-GC-FR' && 
            c.academicYear.toString() === currentYear._id.toString()
        );
        const studentGC = await User.create({
            email: 'etudiant.gc@institut.fr',
            firstName: 'Sophie',
            lastName: 'LEROY',
            matricule: '2024GC001',
            password: 'password123',
            role: 'STUDENT',
            classId: gcClass._id
        });
        console.log(`  ✅ Étudiant GC créé: ${studentGC.email} (${gcClass.code})`);

        // ========================================
        // 7. CRÉATION DE QUELQUES QUIZ SIMPLES
        // ========================================
        console.log('\n📝 CRÉATION DE QUIZ SIMPLES...');

        const quizzes = [];
        const now = new Date();
        const startDate = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000); // Demain
        const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Dans 7 jours

        // Quiz pour chaque cours
        for (const course of createdCourses) {
            const quiz = new Quiz({
                title: `Quiz ${course.name}`,
                courseId: course._id,
                academicYearId: currentYear._id,
                classId: mainClass._id,
                semesterId: createdSemesters[0]._id,
                type: 'MI_PARCOURS',
                status: 'PUBLISHED',
                questions: [
                    {
                        questionId: new mongoose.Types.ObjectId(),
                        textSnapshot: `Question 1 sur ${course.name}`,
                        qType: 'MCQ',
                        optionsSnapshot: [
                            { text: 'Réponse A', order: 1 },
                            { text: 'Réponse B', order: 2 },
                            { text: 'Réponse C', order: 3 },
                            { text: 'Réponse D', order: 4 }
                        ]
                    },
                    {
                        questionId: new mongoose.Types.ObjectId(),
                        textSnapshot: `Question ouverte sur ${course.name}`,
                        qType: 'OPEN',
                        optionsSnapshot: []
                    }
                ],
                startDate: startDate,
                endDate: endDate,
                deadline: endDate
            });
            quizzes.push(quiz);
        }

        await Quiz.insertMany(quizzes);
        console.log(`  ✅ ${quizzes.length} quiz créés`);

        // ========================================
        // 8. RÉSUMÉ FINAL
        // ========================================
        console.log('\n🎉 BASE DE DONNÉES MINIMALE CRÉÉE !');
        console.log('=====================================');
        console.log(`📅 Années académiques: ${createdYears.length} (2024-2025, 2025-2026)`);
        console.log(`📅 Semestres: ${createdSemesters.length}`);
        console.log(`🏫 Classes: ${createdClasses.length} (ISI, SRT, GEN, GC - tous niveaux)`);
        console.log(`📚 Cours: ${createdCourses.length}`);
        console.log(`👥 Utilisateurs: 5 (1 admin + 4 étudiants)`);
        console.log(`📝 Quiz: ${quizzes.length}`);
        console.log('=====================================');
        
        console.log('\n📋 COMPTES DE TEST:');
        console.log(`👨‍💼 Admin: admin@institut.fr / password123`);
        console.log(`👨‍🎓 Étudiant ISI: etudiant.isi@institut.fr / password123 (ING4-ISI-FR)`);
        console.log(`👩‍🎓 Étudiant SRT: etudiant.srt@institut.fr / password123 (ING4-SRT-FR)`);
        console.log(`👨‍🎓 Étudiant GEN: etudiant.gen@institut.fr / password123 (ING3-GEN-FR)`);
        console.log(`👩‍🎓 Étudiant GC: etudiant.gc@institut.fr / password123 (ING4-GC-FR)`);
        
        console.log('\n🎯 FILIÈRES CRÉÉES:');
        console.log('✅ ISI - Ingénierie des Systèmes d\'Information');
        console.log('✅ SRT - Systèmes, Réseaux et Télécommunications');
        console.log('✅ GEN - Formation Généraliste');
        console.log('✅ GC - Génie Civil');
        
        console.log('\n📊 RÉPARTITION PAR ANNÉE:');
        const classesByYear = createdClasses.reduce((acc, cls) => {
            const year = createdYears.find(y => y._id.toString() === cls.academicYear.toString());
            acc[year.label] = (acc[year.label] || 0) + 1;
            return acc;
        }, {});
        Object.entries(classesByYear).forEach(([year, count]) => {
            console.log(`   ${year}: ${count} classes`);
        });

    } catch (error) {
        console.error('❌ Erreur lors de la réinitialisation:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Déconnecté de MongoDB');
    }
}

// Exécution du script
if (require.main === module) {
    resetMinimalDatabase();
}

module.exports = { resetMinimalDatabase };