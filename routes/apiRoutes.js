const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Middlewares
const { protect, adminOnly } = require('../middleware/auth');

// Contrôleurs
const authController = require('../controllers/authController');
const questionController = require('../controllers/questionController');
const quizController = require('../controllers/quizController');
const evaluationController = require('../controllers/evaluationController');
const studentController = require('../controllers/studentController');
const importController = require('../controllers/importController');
const statsController = require('../controllers/statsController');
const academicController = require('../controllers/academicController');
const ocrController = require('../controllers/ocrController');
const notificationController = require('../controllers/notificationController');

/* =========================================
   AUTH
   ========================================= */
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.post('/auth/card-login', authController.cardUploadMiddleware, authController.cardLogin);
router.get('/auth/profile', protect, authController.getProfile);
router.post('/auth/change-password', protect, authController.changePassword);

// Routes pour mot de passe oublié
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/verify-reset-code', authController.verifyResetCode);
router.post('/auth/reset-password', authController.resetPassword);

/* =========================================
   ADMIN - ACADEMIC (Années, Classes, Cours)
   ========================================= */
router.post('/admin/years', protect, adminOnly, academicController.createYear);
router.get('/admin/years', protect, adminOnly, academicController.getYears);
router.put('/admin/years/:id', protect, adminOnly, academicController.updateYear);
router.delete('/admin/years/:id', protect, adminOnly, academicController.deleteYear);

router.post('/admin/classes', protect, adminOnly, academicController.createClass);
router.get('/admin/classes/:yearId', protect, adminOnly, academicController.getClassesByYear);
router.get('/admin/classes', protect, adminOnly, academicController.getAllClasses);
router.put('/admin/classes/:id', protect, adminOnly, academicController.updateClass);
router.delete('/admin/classes/:id', protect, adminOnly, academicController.deleteClass);
router.post('/admin/classes/promote', protect, adminOnly, academicController.promoteClasses);
router.get('/admin/classes/:id/students-count', protect, adminOnly, academicController.getClassStudentsCount);

router.post('/admin/courses', protect, adminOnly, academicController.createCourse);
router.get('/admin/courses/:classId', protect, adminOnly, academicController.getCoursesByClass);
router.get('/admin/courses', protect, adminOnly, academicController.getAllCourses);
router.get('/admin/course/:id', protect, adminOnly, academicController.getCourseById);
router.put('/admin/courses/:id', protect, adminOnly, academicController.updateCourse);
router.delete('/admin/courses/:id', protect, adminOnly, academicController.deleteCourse);

/* =========================================
   SEMESTRES
   ========================================= */
router.post('/semesters', protect, adminOnly, academicController.createSemester);
router.get('/semesters', protect, adminOnly, academicController.getSemesters);
router.get('/semesters/:id', protect, adminOnly, academicController.getSemester);
router.put('/semesters/:id', protect, adminOnly, academicController.updateSemester);
router.delete('/semesters/:id', protect, adminOnly, academicController.deleteSemester);

/* =========================================
   TYPES D'ÉVALUATION
   ========================================= */
router.get('/evaluation-types', protect, academicController.getEvaluationTypes);

/* =========================================
   QUESTIONS
   ========================================= */
router.get('/questions', protect, questionController.getQuestions);
router.get('/questions/check-ouverte', protect, questionController.checkQuestionOuverteExists);
router.get('/questions/ouvertes', protect, questionController.getQuestionsOuvertes);
router.get('/questions/:id', protect, questionController.getQuestion);
router.post('/admin/questions', protect, adminOnly, questionController.createQuestion);
router.put('/admin/questions/:id', protect, adminOnly, questionController.updateQuestion);
router.delete('/admin/questions/:id', protect, adminOnly, questionController.deleteQuestion);

/* =========================================
   EVALUATIONS DE COURS
   ========================================= */
// Récupérer les évaluations pour une classe
router.get('/evaluations', protect, evaluationController.getEvaluationsForClass);
// Récupérer une évaluation spécifique
router.get('/evaluations/:id', protect, evaluationController.getEvaluationById);
// Soumettre une évaluation
router.post('/evaluations/:id/submit', protect, evaluationController.submitEvaluation);
// Sauvegarder un brouillon
router.post('/evaluations/:id/draft', protect, evaluationController.saveDraft);

/* =========================================
   COURSES - GESTION DES COURS
   ========================================= */
// Récupérer les cours pour une classe
router.get('/courses', protect, quizController.getCoursesByClass);

/* =========================================
   ADMIN - QUIZ & QUESTIONS
   ========================================= */
// Gestion des quizz
router.get('/quizzes', protect, quizController.getQuizzes);
router.get('/quizzes/:id', protect, quizController.getQuiz);
router.get('/quizzes/:id/preview', protect, quizController.previewQuiz);
router.get('/quizzes/:id/stats', protect, quizController.getQuizStats);
router.post('/admin/quizzes', protect, adminOnly, quizController.createQuiz);
router.put('/admin/quizzes/:id', protect, adminOnly, quizController.updateQuiz);
router.delete('/admin/quizzes/:id', protect, adminOnly, quizController.deleteQuiz);
router.post('/admin/quizzes/:id/publish', protect, adminOnly, quizController.publishQuiz);
router.post('/admin/quizzes/:id/unpublish', protect, adminOnly, quizController.unpublishQuiz);
router.post('/admin/quizzes/:id/duplicate', protect, adminOnly, quizController.duplicateQuiz);
router.post('/admin/quizzes/:id/archive', protect, adminOnly, quizController.archiveQuiz);
router.post('/admin/quizzes/:id/unarchive', protect, adminOnly, quizController.restoreQuiz);

// Anciennes routes pour compatibilité
// Création manuelle question
router.post('/quiz/question', protect, adminOnly, quizController.createQuestion);
// Import Excel
router.post('/quiz/import', protect, adminOnly, upload.single('file'), importController.importQuestions);
// Création et Publication (déclenche notif)
router.post('/quiz/publish', protect, adminOnly, quizController.createAndPublishQuiz);

/* =========================================
   ADMIN - STATS & IA
   ========================================= */
router.get('/stats/quiz/:quizId', protect, adminOnly, statsController.getQuizStats);

/* =========================================
   STUDENT - VIE ÉTUDIANTE
   ========================================= */
// Liste des quiz à faire
router.get('/student/quizzes', protect, studentController.getMyQuizzes);
// Récupérer les soumissions de l'étudiant
router.get('/student/submissions', protect, studentController.getMySubmissions);
// Récupérer les classes éligibles pour changement
router.get('/student/eligible-classes', protect, studentController.getEligibleClasses);
// Soumettre réponses (sync offline supporté par la nature REST)
router.post('/student/submit', protect, studentController.submitQuiz);
// Mise à jour classe (Année N+1)
router.put('/student/update-class', protect, studentController.updateClass);
// Enregistrer token pour notif push
router.post('/student/fcm-token', protect, studentController.updateFcmToken);

/* =========================================
   OCR - RECONNAISSANCE DE CARTES
   ========================================= */
// Reconnaissance de carte étudiant
router.post('/ocr/recognize', ocrController.uploadMiddleware, ocrController.recognizeCard);

/* =========================================
   NOTIFICATIONS
   ========================================= */
// Enregistrer un token FCM
router.post('/notifications/register-token', protect, notificationController.registerFCMToken);

// Notifier la soumission d'un quiz
router.post('/notifications/quiz-submitted', protect, notificationController.notifyQuizSubmitted);

// Programmer les notifications d'expiration
router.post('/notifications/schedule-expiration', protect, notificationController.scheduleQuizExpirationNotifications);

module.exports = router;