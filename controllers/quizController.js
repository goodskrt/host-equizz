const { sendPushNotification } = require('../utils/firebaseService');
const User = require('../models/User');
const { Quiz, Question } = require('../models/Quiz');
const { Course } = require('../models/Academic');

// @desc    Créer une question manuelle
// @route   POST /api/quiz/question
exports.createQuestion = async (req, res) => {
  try {
    const question = await Question.create(req.body);
    res.status(201).json(question);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Publier un Quiz
// @route   POST /api/quiz/publish
exports.createAndPublishQuiz = async (req, res) => {
  const { title, courseId, type, deadline, questionIds } = req.body;

  try {
    // Récupérer les détails des questions pour faire un snapshot (copie figée)
    const questionsDb = await Question.find({ '_id': { $in: questionIds } });
    
    const questionsPayload = questionsDb.map(q => ({
        questionId: q._id,
        textSnapshot: q.text,
        qType: q.type,
        optionsSnapshot: q.options
    }));

    const quiz = await Quiz.create({
      title,
      courseId,
      type,
      status: 'PUBLISHED',
      questions: questionsPayload,
      deadline
    });
  
    try {
      // 1. Trouver les étudiants de la classe concernée par le cours
      // On doit d'abord trouver la classe liée au cours
      const course = await Course.findById(courseId);
      
      if (course) {
          // 2. Récupérer les tokens des étudiants de cette classe
          const students = await User.find({ 
              classId: course.classId, 
              role: 'STUDENT',
              fcmToken: { $exists: true, $ne: null } // Seulement ceux qui ont l'app installée
          }).select('fcmToken');
          
          const tokens = students.map(s => s.fcmToken);
          
          // 3. Envoyer la notif
          if (tokens.length > 0) {
              await sendPushNotification(
                  tokens,
                  "Nouveau Quiz Disponible !",
                  `Le quiz "${title}" est disponible pour le cours ${course.code}.`,
                  { quizId: quiz._id.toString() }
              );
          }
      }
    } catch (notifError) {
        console.error("Erreur notification (non-bloquant):", notifError);
    }

    res.status(201).json(quiz);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Soumettre un quiz
 * POST /api/quiz/:id/submit
 */
const submitQuiz = async (req, res) => {
    try {
        const { answers } = req.body;
        const quizId = req.params.id;
        
        // Pour l'instant, on retourne juste le score
        const score = Math.floor(Math.random() * 20) + 1; // Score aléatoire entre 1 et 20
        
        console.log(`✅ Quiz soumis avec succès. Score: ${score}/20`);

        res.json({
            success: true,
            data: {
                score: score,
                submittedAt: new Date().toISOString()
            },
            message: 'Quiz soumis avec succès'
        });

    } catch (error) {
        console.error('❌ Erreur lors de la soumission du quiz:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la soumission'
        });
    }
};

/**
 * Récupérer les cours pour une classe
 * GET /api/courses?classId=xxx
 */
const getCoursesByClass = async (req, res) => {
    try {
        const { classId } = req.query;
        
        if (!classId) {
            return res.status(400).json({
                success: false,
                error: 'ID de classe requis'
            });
        }

        console.log('📚 Récupération des cours pour la classe:', classId);

        const courses = await Course.find({ classId })
            .sort({ semester: 1, code: 1 });

        const formattedCourses = courses.map(course => ({
            id: course._id.toString(),
            code: course.code,
            name: course.name,
            classId: course.classId.toString(),
            semester: course.semester
        }));

        console.log(`✅ ${formattedCourses.length} cours trouvés`);

        res.json({
            success: true,
            data: formattedCourses
        });

    } catch (error) {
        console.error('❌ Erreur lors de la récupération des cours:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la récupération des cours'
        });
    }
};

/**
 * Récupérer les quizzes pour une classe
 * GET /api/quiz?classId=xxx
 */
const getQuizzesByClass = async (req, res) => {
    try {
        const { classId } = req.query;
        
        if (!classId) {
            return res.status(400).json({
                success: false,
                error: 'ID de classe requis'
            });
        }

        console.log('📝 Récupération des quizzes pour la classe:', classId);

        // Récupérer les cours de la classe
        const courses = await Course.find({ classId });
        const courseIds = courses.map(c => c._id);

        // Récupérer les quizzes pour ces cours
        const quizzes = await Quiz.find({ 
            courseId: { $in: courseIds },
            status: 'PUBLISHED'
        }).populate('courseId');

        console.log(`✅ ${quizzes.length} quizzes trouvés`);

        res.json({
            success: true,
            data: quizzes
        });

    } catch (error) {
        console.error('❌ Erreur lors de la récupération des quizzes:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la récupération des quizzes'
        });
    }
};

/**
 * Récupérer un quiz par ID
 * GET /api/quiz/:id
 */
const getQuizById = async (req, res) => {
    try {
        const quizId = req.params.id;
        
        const quiz = await Quiz.findById(quizId).populate('courseId');
        
        if (!quiz) {
            return res.status(404).json({
                success: false,
                error: 'Quiz non trouvé'
            });
        }

        res.json({
            success: true,
            data: quiz
        });

    } catch (error) {
        console.error('❌ Erreur lors de la récupération du quiz:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la récupération du quiz'
        });
    }
};

/**
 * Créer un nouveau quiz (pour les enseignants)
 * POST /api/quiz
 */
const createQuiz = async (req, res) => {
    try {
        const { title, courseId, type, questions, deadline } = req.body;

        // Validation des données
        if (!title || !courseId || !type || !questions) {
            return res.status(400).json({
                success: false,
                error: 'Données manquantes (title, courseId, type, questions requis)'
            });
        }

        // Vérifier que le cours existe
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                error: 'Cours non trouvé'
            });
        }

        // Créer le quiz
        const quiz = new Quiz({
            title,
            courseId,
            type,
            questions: questions.map(q => ({
                questionId: q.questionId,
                textSnapshot: q.textSnapshot,
                qType: q.qType,
                optionsSnapshot: q.optionsSnapshot || []
            })),
            deadline: deadline ? new Date(deadline) : null,
            status: 'PUBLISHED'
        });

        await quiz.save();

        console.log(`✅ Quiz créé: ${quiz.title}`);

        res.status(201).json({
            success: true,
            data: {
                id: quiz._id.toString(),
                title: quiz.title,
                courseId: quiz.courseId.toString(),
                type: quiz.type,
                status: quiz.status,
                createdAt: quiz.createdAt.toISOString()
            },
            message: 'Quiz créé avec succès'
        });

    } catch (error) {
        console.error('❌ Erreur lors de la création du quiz:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la création du quiz'
        });
    }
};

module.exports = {
    createQuestion: exports.createQuestion,
    createAndPublishQuiz: exports.createAndPublishQuiz,
    getQuizzesByClass,
    getQuizById,
    submitQuiz,
    getCoursesByClass,
    createQuiz
};