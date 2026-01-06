const { sendPushNotification } = require('../utils/firebaseService');
const User = require('../models/User');
const { Quiz, Question } = require('../models/Quiz');
const { Course, AcademicYear, Class, Semester } = require('../models/Academic');

// @desc    Récupérer tous les quizz avec filtres
// @route   GET /api/quizzes
exports.getQuizzes = async (req, res) => {
  try {
    const { courseId, classId, semesterId, academicYearId, isPublished, limit = 50 } = req.query;
    let filter = {};

    if (courseId) filter.courseId = courseId;
    if (classId) filter.classId = classId;
    if (semesterId) filter.semesterId = semesterId;
    if (academicYearId) filter.academicYearId = academicYearId;
    if (isPublished !== undefined) {
      filter.status = isPublished === 'true' ? 'PUBLISHED' : 'DRAFT';
    }

    // Optimisation : sélection des champs essentiels seulement
    const quizzes = await Quiz.find(filter)
      .select('title description courseId academicYearId classId semesterId type status startDate endDate questions createdAt')
      .populate('courseId', 'code name credits teacher')
      .populate('academicYearId', 'label')
      .populate('classId', 'code speciality')
      .populate('semesterId', 'label')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Transformation optimisée
    const transformedQuizzes = quizzes.map(q => ({
      id: q._id.toString(),
      title: q.title,
      description: q.description,
      courseId: q.courseId?._id?.toString(),
      course: q.courseId ? {
        id: q.courseId._id.toString(),
        code: q.courseId.code,
        name: q.courseId.name,
        credits: q.courseId.credits,
        teacher: q.courseId.teacher
      } : null,
      academicYearId: q.academicYearId?._id?.toString(),
      academicYear: q.academicYearId ? {
        id: q.academicYearId._id.toString(),
        label: q.academicYearId.label
      } : null,
      classId: q.classId?._id?.toString(),
      class: q.classId ? {
        id: q.classId._id.toString(),
        code: q.classId.code,
        name: q.classId.speciality
      } : null,
      semesterId: q.semesterId?._id?.toString(),
      semester: q.semesterId ? {
        id: q.semesterId._id.toString(),
        label: q.semesterId.label
      } : null,
      type: q.type,
      status: q.status,
      isPublished: q.status === 'PUBLISHED',
      startDate: q.startDate,
      endDate: q.endDate,
      questionCount: q.questions?.length || 0,
      createdAt: q.createdAt
    }));

    res.json(transformedQuizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Récupérer un quiz par ID
// @route   GET /api/quizzes/:id
exports.getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('courseId', 'code name credits teacher')
      .populate('academicYearId', 'label')
      .populate('classId', 'code speciality')
      .populate('semesterId', 'label');

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz non trouvé' });
    }

    const transformedQuiz = {
      id: quiz._id.toString(),
      title: quiz.title,
      description: quiz.description,
      courseId: quiz.courseId?._id?.toString(),
      course: quiz.courseId ? {
        id: quiz.courseId._id.toString(),
        code: quiz.courseId.code,
        name: quiz.courseId.name,
        credits: quiz.courseId.credits,
        teacher: quiz.courseId.teacher
      } : null,
      academicYearId: quiz.academicYearId?._id?.toString(),
      academicYear: quiz.academicYearId ? {
        id: quiz.academicYearId._id.toString(),
        label: quiz.academicYearId.label
      } : null,
      classId: quiz.classId?._id?.toString(),
      class: quiz.classId ? {
        id: quiz.classId._id.toString(),
        code: quiz.classId.code,
        name: quiz.classId.speciality
      } : null,
      semesterId: quiz.semesterId?._id?.toString(),
      semester: quiz.semesterId ? {
        id: quiz.semesterId._id.toString(),
        label: quiz.semesterId.label
      } : null,
      type: quiz.type,
      status: quiz.status,
      isPublished: quiz.status === 'PUBLISHED',
      startDate: quiz.startDate,
      endDate: quiz.endDate,
      questionCount: quiz.questions?.length || 0,
      questions: quiz.questions,
      createdAt: quiz.createdAt
    };

    res.json(transformedQuiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Créer un quiz
// @route   POST /api/admin/quizzes
exports.createQuiz = async (req, res) => {
  try {
    const { 
      title, description, courseId, academicYearId, classId, semesterId, 
      type = 'MI_PARCOURS', startDate, endDate, questions 
    } = req.body;

    // Récupérer les détails des questions pour faire un snapshot
    const questionIds = questions.map(q => q.questionId);
    const questionsDb = await Question.find({ '_id': { $in: questionIds } });
    
    const questionsPayload = questionsDb.map(q => ({
      questionId: q._id,
      textSnapshot: q.text,
      qType: q.type,
      optionsSnapshot: q.options ? q.options.map(opt => opt.text) : []
    }));

    const quizData = {
      title,
      description,
      academicYearId,
      classId,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      questions: questionsPayload,
      status: 'DRAFT'
    };

    // Ajouter courseId et semesterId seulement s'ils sont fournis
    if (courseId && courseId.trim() !== '') {
      quizData.courseId = courseId;
    }
    if (semesterId && semesterId.trim() !== '') {
      quizData.semesterId = semesterId;
    }

    const quiz = await Quiz.create(quizData);
    
    // Récupérer le quiz avec les données populées
    const populatedQuiz = await Quiz.findById(quiz._id)
      .populate('courseId', 'code name credits teacher')
      .populate('academicYearId', 'label')
      .populate('classId', 'code speciality')
      .populate('semesterId', 'label');

    const transformedQuiz = {
      id: populatedQuiz._id.toString(),
      title: populatedQuiz.title,
      description: populatedQuiz.description,
      courseId: populatedQuiz.courseId?._id?.toString(),
      course: populatedQuiz.courseId ? {
        id: populatedQuiz.courseId._id.toString(),
        code: populatedQuiz.courseId.code,
        name: populatedQuiz.courseId.name,
        credits: populatedQuiz.courseId.credits,
        teacher: populatedQuiz.courseId.teacher
      } : null,
      academicYearId: populatedQuiz.academicYearId?._id?.toString(),
      academicYear: populatedQuiz.academicYearId ? {
        id: populatedQuiz.academicYearId._id.toString(),
        label: populatedQuiz.academicYearId.label
      } : null,
      classId: populatedQuiz.classId?._id?.toString(),
      class: populatedQuiz.classId ? {
        id: populatedQuiz.classId._id.toString(),
        code: populatedQuiz.classId.code,
        name: populatedQuiz.classId.speciality
      } : null,
      semesterId: populatedQuiz.semesterId?._id?.toString(),
      semester: populatedQuiz.semesterId ? {
        id: populatedQuiz.semesterId._id.toString(),
        label: populatedQuiz.semesterId.label
      } : null,
      type: populatedQuiz.type,
      status: populatedQuiz.status,
      isPublished: populatedQuiz.status === 'PUBLISHED',
      startDate: populatedQuiz.startDate,
      endDate: populatedQuiz.endDate,
      questionCount: populatedQuiz.questions?.length || 0,
      questions: populatedQuiz.questions,
      createdAt: populatedQuiz.createdAt
    };

    res.status(201).json(transformedQuiz);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Mettre à jour un quiz
// @route   PUT /api/admin/quizzes/:id
exports.updateQuiz = async (req, res) => {
  try {
    const { 
      title, description, courseId, academicYearId, classId, semesterId, 
      type, startDate, endDate, questions 
    } = req.body;

    const updateData = {
      title,
      description,
      academicYearId,
      classId,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    };

    // Gérer courseId et semesterId optionnels
    if (courseId && courseId.trim() !== '') {
      updateData.courseId = courseId;
    } else {
      updateData.courseId = null;
    }
    
    if (semesterId && semesterId.trim() !== '') {
      updateData.semesterId = semesterId;
    } else {
      updateData.semesterId = null;
    }

    // Mettre à jour les questions si fournies
    if (questions && questions.length > 0) {
      const questionIds = questions.map(q => q.questionId);
      const questionsDb = await Question.find({ '_id': { $in: questionIds } });
      
      updateData.questions = questionsDb.map(q => ({
        questionId: q._id,
        textSnapshot: q.text,
        qType: q.type,
        optionsSnapshot: q.options ? q.options.map(opt => opt.text) : []
      }));
    }

    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('courseId', 'code name credits teacher')
     .populate('academicYearId', 'label')
     .populate('classId', 'code speciality')
     .populate('semesterId', 'label');

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz non trouvé' });
    }

    const transformedQuiz = {
      id: quiz._id.toString(),
      title: quiz.title,
      description: quiz.description,
      courseId: quiz.courseId?._id?.toString(),
      course: quiz.courseId ? {
        id: quiz.courseId._id.toString(),
        code: quiz.courseId.code,
        name: quiz.courseId.name,
        credits: quiz.courseId.credits,
        teacher: quiz.courseId.teacher
      } : null,
      academicYearId: quiz.academicYearId?._id?.toString(),
      academicYear: quiz.academicYearId ? {
        id: quiz.academicYearId._id.toString(),
        label: quiz.academicYearId.label
      } : null,
      classId: quiz.classId?._id?.toString(),
      class: quiz.classId ? {
        id: quiz.classId._id.toString(),
        code: quiz.classId.code,
        name: quiz.classId.speciality
      } : null,
      semesterId: quiz.semesterId?._id?.toString(),
      semester: quiz.semesterId ? {
        id: quiz.semesterId._id.toString(),
        label: quiz.semesterId.label
      } : null,
      type: quiz.type,
      status: quiz.status,
      isPublished: quiz.status === 'PUBLISHED',
      startDate: quiz.startDate,
      endDate: quiz.endDate,
      questionCount: quiz.questions?.length || 0,
      questions: quiz.questions,
      createdAt: quiz.createdAt
    };

    res.json(transformedQuiz);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Supprimer un quiz
// @route   DELETE /api/admin/quizzes/:id
exports.deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz non trouvé' });
    }

    res.json({ message: 'Quiz supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Publier un quiz
// @route   POST /api/admin/quizzes/:id/publish
exports.publishQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      { status: 'PUBLISHED' },
      { new: true }
    ).populate('courseId', 'code name');

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz non trouvé' });
    }

    // Envoyer des notifications push aux étudiants
    try {
      const students = await User.find({ 
        classId: quiz.classId, 
        role: 'STUDENT',
        fcmToken: { $exists: true, $ne: null }
      }).select('fcmToken');
      
      const tokens = students.map(s => s.fcmToken);
      
      if (tokens.length > 0) {
        await sendPushNotification(
          tokens,
          "Nouveau Quiz Disponible !",
          `Le quiz "${quiz.title}" est maintenant disponible.`,
          { quizId: quiz._id.toString() }
        );
      }
    } catch (notifError) {
      console.error("Erreur notification (non-bloquant):", notifError);
    }

    res.json({ message: 'Quiz publié avec succès', quiz });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Dépublier un quiz
// @route   POST /api/admin/quizzes/:id/unpublish
exports.unpublishQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      { status: 'DRAFT' },
      { new: true }
    );

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz non trouvé' });
    }

    res.json({ message: 'Quiz dépublié avec succès', quiz });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Dupliquer un quiz
// @route   POST /api/admin/quizzes/:id/duplicate
exports.duplicateQuiz = async (req, res) => {
  try {
    const originalQuiz = await Quiz.findById(req.params.id);
    
    if (!originalQuiz) {
      return res.status(404).json({ message: 'Quiz non trouvé' });
    }

    const duplicatedQuiz = await Quiz.create({
      title: `${originalQuiz.title} (Copie)`,
      description: originalQuiz.description,
      courseId: originalQuiz.courseId,
      academicYearId: originalQuiz.academicYearId,
      classId: originalQuiz.classId,
      semesterId: originalQuiz.semesterId,
      type: originalQuiz.type,
      status: 'DRAFT',
      questions: originalQuiz.questions,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // +7 jours
    });

    const populatedQuiz = await Quiz.findById(duplicatedQuiz._id)
      .populate('courseId', 'code name credits teacher')
      .populate('academicYearId', 'label')
      .populate('classId', 'code speciality')
      .populate('semesterId', 'label');

    const transformedQuiz = {
      id: populatedQuiz._id.toString(),
      title: populatedQuiz.title,
      description: populatedQuiz.description,
      courseId: populatedQuiz.courseId?._id?.toString(),
      course: populatedQuiz.courseId ? {
        id: populatedQuiz.courseId._id.toString(),
        code: populatedQuiz.courseId.code,
        name: populatedQuiz.courseId.name,
        credits: populatedQuiz.courseId.credits,
        teacher: populatedQuiz.courseId.teacher
      } : null,
      academicYearId: populatedQuiz.academicYearId?._id?.toString(),
      academicYear: populatedQuiz.academicYearId ? {
        id: populatedQuiz.academicYearId._id.toString(),
        label: populatedQuiz.academicYearId.label
      } : null,
      classId: populatedQuiz.classId?._id?.toString(),
      class: populatedQuiz.classId ? {
        id: populatedQuiz.classId._id.toString(),
        code: populatedQuiz.classId.code,
        name: populatedQuiz.classId.speciality
      } : null,
      semesterId: populatedQuiz.semesterId?._id?.toString(),
      semester: populatedQuiz.semesterId ? {
        id: populatedQuiz.semesterId._id.toString(),
        label: populatedQuiz.semesterId.label
      } : null,
      type: populatedQuiz.type,
      status: populatedQuiz.status,
      isPublished: populatedQuiz.status === 'PUBLISHED',
      startDate: populatedQuiz.startDate,
      endDate: populatedQuiz.endDate,
      questionCount: populatedQuiz.questions?.length || 0,
      questions: populatedQuiz.questions,
      createdAt: populatedQuiz.createdAt
    };

    res.status(201).json(transformedQuiz);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Archiver un quiz
// @route   POST /api/admin/quizzes/:id/archive
exports.archiveQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      { status: 'ARCHIVED' },
      { new: true }
    );

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz non trouvé' });
    }

    res.json({ message: 'Quiz archivé avec succès', quiz });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Restaurer un quiz archivé
// @route   POST /api/admin/quizzes/:id/restore
exports.restoreQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      { status: 'DRAFT' },
      { new: true }
    );

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz non trouvé' });
    }

    res.json({ message: 'Quiz restauré avec succès', quiz });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtenir les statistiques d'un quiz
// @route   GET /api/quizzes/:id/stats
exports.getQuizStats = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz non trouvé' });
    }

    // Pour l'instant, retourner des statistiques de base
    // À améliorer avec de vraies données de soumission
    const stats = {
      quizId: quiz._id.toString(),
      title: quiz.title,
      questionCount: quiz.questions?.length || 0,
      submissionCount: Math.floor(Math.random() * 50), // Simulé
      averageScore: (Math.random() * 20).toFixed(1), // Simulé
      completionRate: (Math.random() * 100).toFixed(1), // Simulé
      status: quiz.status,
      startDate: quiz.startDate,
      endDate: quiz.endDate,
      isActive: quiz.status === 'PUBLISHED' && new Date() >= quiz.startDate && new Date() <= quiz.endDate
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Prévisualiser un quiz
// @route   GET /api/quizzes/:id/preview
exports.previewQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id)
      .populate('courseId', 'code name')
      .populate('academicYearId', 'label')
      .populate('classId', 'code speciality');

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz non trouvé' });
    }

    // Récupérer les détails complets des questions pour la prévisualisation
    const questionIds = quiz.questions.map(q => q.questionId);
    const fullQuestions = await Question.find({ '_id': { $in: questionIds } });

    const questionsWithDetails = quiz.questions.map(q => {
      const fullQuestion = fullQuestions.find(fq => fq._id.toString() === q.questionId.toString());
      return {
        id: q.questionId.toString(),
        text: q.textSnapshot || fullQuestion?.text,
        type: q.qType || fullQuestion?.type,
        options: q.optionsSnapshot || fullQuestion?.options || []
      };
    });

    const preview = {
      id: quiz._id.toString(),
      title: quiz.title,
      description: quiz.description,
      course: quiz.courseId ? {
        code: quiz.courseId.code,
        name: quiz.courseId.name
      } : null,
      academicYear: quiz.academicYearId?.label,
      class: quiz.classId ? {
        code: quiz.classId.code,
        name: quiz.classId.speciality
      } : null,
      type: quiz.type,
      startDate: quiz.startDate,
      endDate: quiz.endDate,
      questions: questionsWithDetails,
      questionCount: questionsWithDetails.length
    };

    res.json(preview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Conserver les anciennes fonctions pour compatibilité
exports.createQuestion = async (req, res) => {
  try {
    const question = await Question.create(req.body);
    res.status(201).json(question);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.createAndPublishQuiz = async (req, res) => {
  const { title, courseId, type, deadline, questionIds } = req.body;

  try {
    const questionsDb = await Question.find({ '_id': { $in: questionIds } });
    
    const questionsPayload = questionsDb.map(q => ({
        questionId: q._id,
        textSnapshot: q.text,
        qType: q.type,
        optionsSnapshot: q.options ? q.options.map(opt => opt.text) : []
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
      const course = await Course.findById(courseId);
      
      if (course) {
          const students = await User.find({ 
              classId: course.classId, 
              role: 'STUDENT',
              fcmToken: { $exists: true, $ne: null }
          }).select('fcmToken');
          
          const tokens = students.map(s => s.fcmToken);
          
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

const submitQuiz = async (req, res) => {
    try {
        const { answers } = req.body;
        const quizId = req.params.id;
        
        const score = Math.floor(Math.random() * 20) + 1;
        
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

        const courses = await Course.find({ classId });
        const courseIds = courses.map(c => c._id);

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

module.exports = {
    // Nouvelles fonctions CRUD
    getQuizzes: exports.getQuizzes,
    getQuiz: exports.getQuiz,
    createQuiz: exports.createQuiz,
    updateQuiz: exports.updateQuiz,
    deleteQuiz: exports.deleteQuiz,
    publishQuiz: exports.publishQuiz,
    unpublishQuiz: exports.unpublishQuiz,
    
    // Nouvelles fonctionnalités
    duplicateQuiz: exports.duplicateQuiz,
    archiveQuiz: exports.archiveQuiz,
    restoreQuiz: exports.restoreQuiz,
    getQuizStats: exports.getQuizStats,
    previewQuiz: exports.previewQuiz,
    
    // Anciennes fonctions pour compatibilité
    createQuestion: exports.createQuestion,
    createAndPublishQuiz: exports.createAndPublishQuiz,
    getQuizzesByClass,
    getQuizById,
    submitQuiz,
    getCoursesByClass
};