/**
 * Script pour peupler la base de données avec des quiz de test
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { Quiz } = require('../models/Quiz');
const { Course, Class } = require('../models/Academic');

async function seedQuizzes() {
    try {
        // Connexion à MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connexion à MongoDB établie');

        // Récupérer la classe ING4-ISI-FR
        const classe = await Class.findOne({ code: 'ING4-ISI-FR' });
        if (!classe) {
            console.log('❌ Classe ING4-ISI-FR non trouvée');
            return;
        }

        console.log('🎓 Classe trouvée:', classe.code);

        // Récupérer les cours de cette classe
        const courses = await Course.find({ classId: classe._id });
        console.log(`📚 ${courses.length} cours trouvés pour cette classe`);

        if (courses.length === 0) {
            console.log('❌ Aucun cours trouvé pour cette classe');
            return;
        }

        // Supprimer les anciens quiz
        await Quiz.deleteMany({});
        console.log('🗑️ Anciens quiz supprimés');

        // Créer des quiz pour chaque cours
        const quizzes = [];
        const now = new Date();

        for (let i = 0; i < courses.length; i++) {
            const course = courses[i];
            
            // Quiz actif (en cours)
            const activeQuiz = new Quiz({
                title: `Quiz ${course.name} - Mi-Parcours`,
                courseId: course._id,
                type: 'MI_PARCOURS', // Enum valide
                status: 'PUBLISHED', // Enum valide
                questions: [
                    {
                        questionId: new mongoose.Types.ObjectId(), // ObjectId valide
                        textSnapshot: `Quelle est la définition principale de ${course.name} ?`,
                        qType: 'MCQ',
                        optionsSnapshot: ['Option A', 'Option B', 'Option C', 'Option D']
                    },
                    {
                        questionId: new mongoose.Types.ObjectId(), // ObjectId valide
                        textSnapshot: `Expliquez l'importance de ${course.name} dans votre formation.`,
                        qType: 'OPEN',
                        optionsSnapshot: []
                    }
                ],
                deadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // Dans 7 jours
            });

            quizzes.push(activeQuiz);

            // Quiz à venir (pour certains cours)
            if (i < 3) {
                const upcomingQuiz = new Quiz({
                    title: `Quiz ${course.name} - Final`,
                    courseId: course._id,
                    type: 'FINAL', // Enum valide
                    status: 'DRAFT', // Enum valide
                    questions: [
                        {
                            questionId: new mongoose.Types.ObjectId(), // ObjectId valide
                            textSnapshot: `Question finale sur ${course.name}`,
                            qType: 'MCQ',
                            optionsSnapshot: ['Réponse 1', 'Réponse 2', 'Réponse 3']
                        }
                    ],
                    deadline: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) // Dans 14 jours
                });

                quizzes.push(upcomingQuiz);
            }
        }

        // Sauvegarder tous les quiz
        await Quiz.insertMany(quizzes);
        console.log(`✅ ${quizzes.length} quiz créés avec succès`);

        // Afficher un résumé
        const publishedCount = quizzes.filter(q => q.status === 'PUBLISHED').length;
        const draftCount = quizzes.filter(q => q.status === 'DRAFT').length;

        console.log('\n📊 Résumé:');
        console.log(`🟢 Quiz publiés: ${publishedCount}`);
        console.log(`🟡 Quiz en brouillon: ${draftCount}`);
        console.log(`📝 Total: ${quizzes.length}`);

        console.log('\n✅ Peuplement terminé avec succès');

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

seedQuizzes();