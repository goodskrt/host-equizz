/**
 * CONTRÔLEUR: evaluationController.js
 * 
 * Gestion des évaluations de cours (contenu, méthodes, organisation)
 * Focus sur l'évaluation de la qualité des cours par les étudiants
 */

const { Course } = require('../models/Academic');
const User = require('../models/User');

/**
 * Récupérer toutes les évaluations pour une classe
 * GET /api/evaluations?classId=xxx
 */
const getEvaluationsForClass = async (req, res) => {
    try {
        const { classId } = req.query;
        
        if (!classId) {
            return res.status(400).json({
                success: false,
                error: 'ID de classe requis'
            });
        }

        console.log('📋 Récupération des évaluations pour la classe:', classId);

        // Récupérer les cours de la classe
        const courses = await Course.find({ classId });
        
        // Générer des évaluations réalistes pour chaque cours
        const evaluations = [];
        const now = new Date();

        for (const course of courses) {
            // Évaluation Mi-Parcours
            const miParcoursStart = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)); // Il y a 30 jours
            const miParcoursEnd = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)); // Dans 7 jours
            
            evaluations.push({
                id: `eval-mi-${course._id}`,
                title: `Évaluation Mi-Parcours - ${course.name}`,
                description: `Évaluez la qualité du cours ${course.name}, son contenu, les méthodes pédagogiques et l'organisation à mi-parcours.`,
                courseId: course._id.toString(),
                course: {
                    id: course._id.toString(),
                    code: course.code,
                    name: course.name,
                    classId: course.classId.toString(),
                    semester: course.semester
                },
                type: 'MI_PARCOURS',
                status: 'ACTIVE',
                questions: generateEvaluationQuestions('MI_PARCOURS'),
                startDate: miParcoursStart.toISOString(),
                endDate: miParcoursEnd.toISOString(),
                isAnonymous: true,
                allowMultipleSubmissions: false,
                totalResponses: Math.floor(Math.random() * 15) + 5,
                targetStudents: 25,
                settings: {
                    showResults: false,
                    requireComment: true,
                    randomizeQuestions: false
                },
                createdAt: new Date(miParcoursStart.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: miParcoursStart.toISOString()
            });

            // Évaluation Fin de Semestre
            const finSemestreStart = new Date(now.getTime() - (15 * 24 * 60 * 60 * 1000)); // Il y a 15 jours
            const finSemestreEnd = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000)); // Dans 14 jours
            
            evaluations.push({
                id: `eval-fin-${course._id}`,
                title: `Évaluation Fin de Semestre - ${course.name}`,
                description: `Évaluation complète du cours ${course.name} : contenu, méthodes, organisation et satisfaction générale.`,
                courseId: course._id.toString(),
                course: {
                    id: course._id.toString(),
                    code: course.code,
                    name: course.name,
                    classId: course.classId.toString(),
                    semester: course.semester
                },
                type: 'FIN_SEMESTRE',
                status: 'ACTIVE',
                questions: generateEvaluationQuestions('FIN_SEMESTRE'),
                startDate: finSemestreStart.toISOString(),
                endDate: finSemestreEnd.toISOString(),
                isAnonymous: true,
                allowMultipleSubmissions: false,
                totalResponses: Math.floor(Math.random() * 18) + 7,
                targetStudents: 25,
                settings: {
                    showResults: true,
                    requireComment: true,
                    randomizeQuestions: true
                },
                createdAt: new Date(finSemestreStart.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: finSemestreStart.toISOString()
            });

            // Évaluation Fin de Cours (pour certains cours)
            if (Math.random() < 0.4) { // 40% des cours ont une évaluation finale
                const finCoursStart = new Date(now.getTime() + (5 * 24 * 60 * 60 * 1000)); // Dans 5 jours
                const finCoursEnd = new Date(now.getTime() + (20 * 24 * 60 * 60 * 1000)); // Dans 20 jours
                
                evaluations.push({
                    id: `eval-final-${course._id}`,
                    title: `Évaluation Finale - ${course.name}`,
                    description: `Évaluation finale du cours ${course.name} après achèvement complet du programme.`,
                    courseId: course._id.toString(),
                    course: {
                        id: course._id.toString(),
                        code: course.code,
                        name: course.name,
                        classId: course.classId.toString(),
                        semester: course.semester
                    },
                    type: 'FIN_COURS',
                    status: 'DRAFT',
                    questions: generateEvaluationQuestions('FIN_COURS'),
                    startDate: finCoursStart.toISOString(),
                    endDate: finCoursEnd.toISOString(),
                    isAnonymous: true,
                    allowMultipleSubmissions: false,
                    totalResponses: 0,
                    targetStudents: 25,
                    settings: {
                        showResults: true,
                        requireComment: false,
                        randomizeQuestions: false
                    },
                    createdAt: new Date(finCoursStart.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                    updatedAt: new Date(finCoursStart.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
                });
            }
        }

        console.log(`✅ ${evaluations.length} évaluations générées pour ${courses.length} cours`);

        res.json({
            success: true,
            data: evaluations
        });

    } catch (error) {
        console.error('❌ Erreur lors de la récupération des évaluations:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la récupération des évaluations'
        });
    }
};

/**
 * Récupérer une évaluation spécifique
 * GET /api/evaluations/:id
 */
const getEvaluationById = async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log('📋 Récupération de l\'évaluation:', id);

        // Pour cette démo, on génère une évaluation basée sur l'ID
        // Dans un vrai système, on récupérerait depuis la base de données
        const evaluation = {
            id: id,
            title: `Évaluation de Cours - ${id}`,
            description: 'Évaluation complète du cours : contenu, méthodes pédagogiques et organisation.',
            courseId: 'course-1',
            type: 'FIN_SEMESTRE',
            status: 'ACTIVE',
            questions: generateEvaluationQuestions('FIN_SEMESTRE'),
            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            isAnonymous: true,
            allowMultipleSubmissions: false,
            totalResponses: 12,
            targetStudents: 25,
            settings: {
                showResults: true,
                requireComment: true,
                randomizeQuestions: true
            },
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        };

        res.json({
            success: true,
            data: evaluation
        });

    } catch (error) {
        console.error('❌ Erreur lors de la récupération de l\'évaluation:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la récupération de l\'évaluation'
        });
    }
};

/**
 * Soumettre une évaluation de cours
 * POST /api/evaluations/:id/submit
 */
const submitEvaluation = async (req, res) => {
    try {
        const { id } = req.params;
        const { answers, generalComment, suggestions } = req.body;
        
        console.log(`📋 Soumission de l'évaluation ${id} avec ${answers?.length || 0} réponses`);

        // Simuler la sauvegarde de l'évaluation
        // Dans un vrai système, on sauvegarderait en base de données
        
        res.json({
            success: true,
            data: {
                evaluationId: id,
                submittedAt: new Date().toISOString(),
                responseCount: answers?.length || 0
            },
            message: 'Évaluation de cours soumise avec succès'
        });

    } catch (error) {
        console.error('❌ Erreur lors de la soumission de l\'évaluation:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la soumission de l\'évaluation'
        });
    }
};

/**
 * Sauvegarder un brouillon d'évaluation
 * POST /api/evaluations/:id/draft
 */
const saveDraft = async (req, res) => {
    try {
        const { id } = req.params;
        const { answers } = req.body;
        
        console.log(`📋 Sauvegarde du brouillon pour l'évaluation ${id}`);

        res.json({
            success: true,
            data: {
                evaluationId: id,
                savedAt: new Date().toISOString(),
                progress: Math.floor((answers?.length || 0) / 15 * 100)
            },
            message: 'Brouillon sauvegardé avec succès'
        });

    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde du brouillon:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la sauvegarde du brouillon'
        });
    }
};

/**
 * Générer des questions d'évaluation réalistes
 */
function generateEvaluationQuestions(type) {
    const baseQuestions = [
        // Questions sur le contenu du cours
        {
            questionId: 'q1',
            textSnapshot: 'Comment évaluez-vous la qualité du contenu du cours ?',
            typeSnapshot: 'RATING',
            categorySnapshot: 'CONTENU',
            isRequiredSnapshot: true,
            order: 1
        },
        {
            questionId: 'q2',
            textSnapshot: 'Le contenu du cours correspond-il au programme annoncé ?',
            typeSnapshot: 'MCQ',
            categorySnapshot: 'CONTENU',
            optionsSnapshot: ['Parfaitement', 'Plutôt bien', 'Partiellement', 'Pas du tout'],
            isRequiredSnapshot: true,
            order: 2
        },
        {
            questionId: 'q3',
            textSnapshot: 'Les supports de cours (slides, documents) sont-ils de bonne qualité ?',
            typeSnapshot: 'RATING',
            categorySnapshot: 'CONTENU',
            isRequiredSnapshot: true,
            order: 3
        },
        
        // Questions sur les méthodes pédagogiques
        {
            questionId: 'q4',
            textSnapshot: 'Comment évaluez-vous les méthodes pédagogiques utilisées ?',
            typeSnapshot: 'RATING',
            categorySnapshot: 'PEDAGOGIE',
            isRequiredSnapshot: true,
            order: 4
        },
        {
            questionId: 'q5',
            textSnapshot: 'Les explications données en cours sont-elles claires ?',
            typeSnapshot: 'RATING',
            categorySnapshot: 'PEDAGOGIE',
            isRequiredSnapshot: true,
            order: 5
        },
        {
            questionId: 'q6',
            textSnapshot: 'Y a-t-il suffisamment d\'exemples pratiques ?',
            typeSnapshot: 'MCQ',
            categorySnapshot: 'PEDAGOGIE',
            optionsSnapshot: ['Beaucoup trop', 'Suffisamment', 'Pas assez', 'Aucun'],
            isRequiredSnapshot: true,
            order: 6
        },
        
        // Questions sur l'organisation
        {
            questionId: 'q7',
            textSnapshot: 'Comment évaluez-vous l\'organisation générale du cours ?',
            typeSnapshot: 'RATING',
            categorySnapshot: 'ORGANISATION',
            isRequiredSnapshot: true,
            order: 7
        },
        {
            questionId: 'q8',
            textSnapshot: 'Le rythme du cours est-il adapté ?',
            typeSnapshot: 'MCQ',
            categorySnapshot: 'ORGANISATION',
            optionsSnapshot: ['Trop rapide', 'Adapté', 'Trop lent'],
            isRequiredSnapshot: true,
            order: 8
        },
        
        // Questions générales
        {
            questionId: 'q9',
            textSnapshot: 'Quelle est votre satisfaction générale concernant ce cours ?',
            typeSnapshot: 'RATING',
            categorySnapshot: 'GENERAL',
            isRequiredSnapshot: true,
            order: 9
        },
        {
            questionId: 'q10',
            textSnapshot: 'Recommanderiez-vous ce cours à d\'autres étudiants ?',
            typeSnapshot: 'YES_NO',
            categorySnapshot: 'GENERAL',
            optionsSnapshot: ['Oui', 'Non'],
            isRequiredSnapshot: true,
            order: 10
        }
    ];

    // Questions supplémentaires selon le type d'évaluation
    if (type === 'FIN_SEMESTRE' || type === 'FIN_COURS') {
        baseQuestions.push(
            {
                questionId: 'q11',
                textSnapshot: 'Avez-vous des suggestions pour améliorer ce cours ?',
                typeSnapshot: 'OPEN',
                categorySnapshot: 'GENERAL',
                isRequiredSnapshot: false,
                order: 11
            },
            {
                questionId: 'q12',
                textSnapshot: 'Qu\'avez-vous le plus apprécié dans ce cours ?',
                typeSnapshot: 'OPEN',
                categorySnapshot: 'GENERAL',
                isRequiredSnapshot: false,
                order: 12
            }
        );
    }

    return baseQuestions;
}

module.exports = {
    getEvaluationsForClass,
    getEvaluationById,
    submitEvaluation,
    saveDraft
};