/**
 * Script de vérification de la base de données
 * Vérifie que les données ont été correctement créées
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

// Modèles
const User = require('../models/User');
const { AcademicYear, Class, Course, Semester } = require('../models/Academic');
const { Quiz } = require('../models/Quiz');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/equizz';

async function verifyDatabase() {
    try {
        // Connexion à MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connecté à MongoDB');

        // ========================================
        // VÉRIFICATION DES DONNÉES
        // ========================================
        console.log('\n🔍 VÉRIFICATION DE LA BASE DE DONNÉES...');

        // Années académiques
        const years = await AcademicYear.find().sort({ label: 1 });
        console.log(`\n📅 ANNÉES ACADÉMIQUES (${years.length}):`);
        years.forEach(year => {
            console.log(`   ${year.label} ${year.isCurrent ? '(courante)' : ''}`);
        });

        // Semestres
        const semesters = await Semester.find().populate('academicYear');
        console.log(`\n📅 SEMESTRES (${semesters.length}):`);
        semesters.forEach(semester => {
            console.log(`   ${semester.label} - ${semester.academicYear.label}`);
        });

        // Classes par filière
        const classes = await Class.find().populate('academicYear').sort({ speciality: 1, level: 1, language: 1 });
        console.log(`\n🏫 CLASSES (${classes.length}):`);
        
        const classesBySpeciality = classes.reduce((acc, cls) => {
            if (!acc[cls.speciality]) acc[cls.speciality] = [];
            acc[cls.speciality].push(cls);
            return acc;
        }, {});

        Object.entries(classesBySpeciality).forEach(([speciality, classList]) => {
            console.log(`\n   ${speciality} (${classList.length} classes):`);
            const byYear = classList.reduce((acc, cls) => {
                const yearLabel = cls.academicYear.label;
                if (!acc[yearLabel]) acc[yearLabel] = [];
                acc[yearLabel].push(cls);
                return acc;
            }, {});
            
            Object.entries(byYear).forEach(([year, yearClasses]) => {
                console.log(`     ${year}: ${yearClasses.map(c => c.code).join(', ')}`);
            });
        });

        // Cours
        const courses = await Course.find().populate('classId').populate('semesterId');
        console.log(`\n📚 COURS (${courses.length}):`);
        courses.forEach(course => {
            console.log(`   ${course.code} - ${course.name} (${course.classId.code}, ${course.semesterId.label})`);
        });

        // Utilisateurs
        const users = await User.find().populate('classId');
        console.log(`\n👥 UTILISATEURS (${users.length}):`);
        users.forEach(user => {
            const classInfo = user.classId ? ` (${user.classId.code})` : '';
            console.log(`   ${user.role}: ${user.email}${classInfo}`);
        });

        // Quiz
        const quizzes = await Quiz.find().populate('courseId').populate('classId').populate('academicYearId');
        console.log(`\n📝 QUIZ (${quizzes.length}):`);
        quizzes.forEach(quiz => {
            console.log(`   ${quiz.title} - ${quiz.status} (${quiz.classId.code}, ${quiz.academicYearId.label})`);
            console.log(`     Questions: ${quiz.questions.length}`);
        });

        // ========================================
        // STATISTIQUES RÉSUMÉES
        // ========================================
        console.log('\n📊 STATISTIQUES RÉSUMÉES:');
        console.log('=====================================');
        console.log(`📅 Années académiques: ${years.length}`);
        console.log(`📅 Semestres: ${semesters.length}`);
        console.log(`🏫 Classes: ${classes.length}`);
        console.log(`📚 Cours: ${courses.length}`);
        console.log(`👥 Utilisateurs: ${users.length}`);
        console.log(`📝 Quiz: ${quizzes.length}`);
        
        const totalQuestions = quizzes.reduce((sum, quiz) => sum + quiz.questions.length, 0);
        console.log(`❓ Questions totales: ${totalQuestions}`);
        
        console.log('\n🎯 FILIÈRES DISPONIBLES:');
        Object.keys(classesBySpeciality).forEach(speciality => {
            console.log(`   ✅ ${speciality}`);
        });

        console.log('\n✅ VÉRIFICATION TERMINÉE - BASE DE DONNÉES OPÉRATIONNELLE');

    } catch (error) {
        console.error('❌ Erreur lors de la vérification:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Déconnecté de MongoDB');
    }
}

// Exécution du script
if (require.main === module) {
    verifyDatabase();
}

module.exports = { verifyDatabase };