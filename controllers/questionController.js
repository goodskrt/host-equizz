const { Question } = require('../models/Quiz');
const { Course, AcademicYear, Class } = require('../models/Academic');

// @desc    Récupérer toutes les questions avec filtres
// @route   GET /api/questions
exports.getQuestions = async (req, res) => {
  try {
    const { coursId, courseId, academicYearId, classId, type, all } = req.query;
    let filter = {};

    // Accepter à la fois coursId et courseId pour compatibilité
    const finalCourseId = coursId || courseId;
    if (finalCourseId) filter.courseId = finalCourseId;
    if (academicYearId) filter.academicYearId = academicYearId;
    if (classId) filter.classId = classId;
    if (type) filter.type = type;

    console.log('Filtres questions:', filter);

    const questions = await Question.find(filter)
      .populate('courseId', 'code name')
      .populate('academicYearId', 'label')
      .populate('classId', 'code speciality')
      .sort({ order: 1, createdAt: 1 });

    console.log(`Questions trouvées: ${questions.length}`);

    // Transformer les données pour le frontend
    const transformedQuestions = questions.map(q => ({
      id: q._id.toString(),
      texte: q.text, // Utiliser 'texte' pour le frontend français
      text: q.text,
      type: q.type,
      options: q.options || [],
      coursId: q.courseId?._id?.toString(), // Utiliser 'coursId' pour le frontend
      courseId: q.courseId?._id?.toString(),
      course: q.courseId ? {
        id: q.courseId._id.toString(),
        code: q.courseId.code,
        name: q.courseId.name
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
      order: q.order,
      createdAt: q.createdAt
    }));

    res.json(transformedQuestions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Récupérer une question par ID
// @route   GET /api/questions/:id
exports.getQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate('courseId', 'code name')
      .populate('academicYearId', 'label')
      .populate('classId', 'code speciality');

    if (!question) {
      return res.status(404).json({ message: 'Question non trouvée' });
    }

    const transformedQuestion = {
      id: question._id.toString(),
      text: question.text,
      type: question.type,
      options: question.options || [],
      courseId: question.courseId?._id?.toString(),
      course: question.courseId ? {
        id: question.courseId._id.toString(),
        code: question.courseId.code,
        name: question.courseId.name
      } : null,
      academicYearId: question.academicYearId?._id?.toString(),
      academicYear: question.academicYearId ? {
        id: question.academicYearId._id.toString(),
        label: question.academicYearId.label
      } : null,
      classId: question.classId?._id?.toString(),
      class: question.classId ? {
        id: question.classId._id.toString(),
        code: question.classId.code,
        name: question.classId.speciality
      } : null,
      order: question.order,
      createdAt: question.createdAt
    };

    res.json(transformedQuestion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Créer une question
// @route   POST /api/admin/questions
exports.createQuestion = async (req, res) => {
  try {
    const { texte, type, options, coursId, academicYearId, classId } = req.body;

    const questionData = {
      text: texte,
      type: type,
      academicYearId,
      classId
    };

    // Seulement ajouter courseId si un cours est spécifié et non vide
    if (coursId && coursId.trim() !== '') {
      questionData.courseId = coursId;
    }

    if (options && options.length > 0) {
      questionData.options = options.map(opt => ({
        text: opt.texte,
        order: opt.ordre
      }));
    }

    const question = await Question.create(questionData);
    
    // Récupérer la question avec les données populées
    const populatedQuestion = await Question.findById(question._id)
      .populate('courseId', 'code name')
      .populate('academicYearId', 'label')
      .populate('classId', 'code speciality');

    const transformedQuestion = {
      id: populatedQuestion._id.toString(),
      text: populatedQuestion.text,
      type: populatedQuestion.type,
      options: populatedQuestion.options || [],
      courseId: populatedQuestion.courseId?._id?.toString(),
      course: populatedQuestion.courseId ? {
        id: populatedQuestion.courseId._id.toString(),
        code: populatedQuestion.courseId.code,
        name: populatedQuestion.courseId.name
      } : null,
      academicYearId: populatedQuestion.academicYearId?._id?.toString(),
      academicYear: populatedQuestion.academicYearId ? {
        id: populatedQuestion.academicYearId._id.toString(),
        label: populatedQuestion.academicYearId.label
      } : null,
      classId: populatedQuestion.classId?._id?.toString(),
      class: populatedQuestion.classId ? {
        id: populatedQuestion.classId._id.toString(),
        code: populatedQuestion.classId.code,
        name: populatedQuestion.classId.speciality
      } : null,
      order: populatedQuestion.order,
      createdAt: populatedQuestion.createdAt
    };

    res.status(201).json(transformedQuestion);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Mettre à jour une question
// @route   PUT /api/admin/questions/:id
exports.updateQuestion = async (req, res) => {
  try {
    const { texte, type, options, coursId, academicYearId, classId } = req.body;

    const updateData = {
      text: texte,
      type: type,
      academicYearId,
      classId
    };

    // Seulement ajouter courseId si un cours est spécifié et non vide
    if (coursId && coursId.trim() !== '') {
      updateData.courseId = coursId;
    } else {
      // Si coursId est vide, on supprime la référence au cours
      updateData.courseId = null;
    }

    if (options && options.length > 0) {
      updateData.options = options.map(opt => ({
        text: opt.texte,
        order: opt.ordre
      }));
    }

    const question = await Question.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('courseId', 'code name')
     .populate('academicYearId', 'label')
     .populate('classId', 'code speciality');

    if (!question) {
      return res.status(404).json({ message: 'Question non trouvée' });
    }

    const transformedQuestion = {
      id: question._id.toString(),
      text: question.text,
      type: question.type,
      options: question.options || [],
      courseId: question.courseId?._id?.toString(),
      course: question.courseId ? {
        id: question.courseId._id.toString(),
        code: question.courseId.code,
        name: question.courseId.name
      } : null,
      academicYearId: question.academicYearId?._id?.toString(),
      academicYear: question.academicYearId ? {
        id: question.academicYearId._id.toString(),
        label: question.academicYearId.label
      } : null,
      classId: question.classId?._id?.toString(),
      class: question.classId ? {
        id: question.classId._id.toString(),
        code: question.classId.code,
        name: question.classId.speciality
      } : null,
      order: question.order,
      createdAt: question.createdAt
    };

    res.json(transformedQuestion);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Supprimer une question
// @route   DELETE /api/admin/questions/:id
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);

    if (!question) {
      return res.status(404).json({ message: 'Question non trouvée' });
    }

    res.json({ message: 'Question supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Vérifier si une question ouverte existe
// @route   GET /api/questions/check-ouverte
exports.checkQuestionOuverteExists = async (req, res) => {
  try {
    const { coursId } = req.query;
    let filter = { type: 'OPEN' };
    
    if (coursId) {
      filter.courseId = coursId;
    }

    const count = await Question.countDocuments(filter);
    res.json({ exists: count > 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Récupérer les questions ouvertes
// @route   GET /api/questions/ouvertes
exports.getQuestionsOuvertes = async (req, res) => {
  try {
    const { coursId } = req.query;
    let filter = { type: 'OPEN' };
    
    if (coursId) {
      filter.courseId = coursId;
    }

    const questions = await Question.find(filter)
      .populate('courseId', 'code name')
      .populate('academicYearId', 'label')
      .populate('classId', 'code speciality')
      .sort({ order: 1, createdAt: 1 });

    const transformedQuestions = questions.map(q => ({
      id: q._id.toString(),
      text: q.text,
      type: q.type,
      courseId: q.courseId?._id?.toString(),
      course: q.courseId ? {
        id: q.courseId._id.toString(),
        code: q.courseId.code,
        name: q.courseId.name
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
      order: q.order,
      createdAt: q.createdAt
    }));

    res.json(transformedQuestions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};