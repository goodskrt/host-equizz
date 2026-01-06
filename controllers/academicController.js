const { AcademicYear, Semester, Class, Course } = require('../models/Academic');

// --- ANNÉES ACADÉMIQUES ---

// @desc    Créer une année académique
// @route   POST /api/admin/years
exports.createYear = async (req, res) => {
  try {
    const { label, startDate, endDate, isCurrent } = req.body;
    
    // Si celle-ci est courante, désactiver les autres
    if (isCurrent) {
      await AcademicYear.updateMany({}, { isCurrent: false });
    }

    const year = await AcademicYear.create({ label, startDate, endDate, isCurrent });
    res.status(201).json(year);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Lister les années
// @route   GET /api/admin/years
exports.getYears = async (req, res) => {
  const years = await AcademicYear.find().sort({ createdAt: -1 });
  res.json(years);
};

// @desc    Mettre à jour une année académique
// @route   PUT /api/admin/years/:id
exports.updateYear = async (req, res) => {
  try {
    const { label, isCurrent } = req.body;
    
    // Si celle-ci devient courante, désactiver les autres
    if (isCurrent) {
      await AcademicYear.updateMany({}, { isCurrent: false });
    }

    const updatedYear = await AcademicYear.findByIdAndUpdate(
      req.params.id,
      { label, isCurrent },
      { new: true, runValidators: true }
    );
    
    if (!updatedYear) {
      return res.status(404).json({ message: 'Année académique non trouvée' });
    }
    
    res.json(updatedYear);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Supprimer une année académique
// @route   DELETE /api/admin/years/:id
exports.deleteYear = async (req, res) => {
  try {
    const year = await AcademicYear.findById(req.params.id);
    
    if (!year) {
      return res.status(404).json({ message: 'Année académique non trouvée' });
    }
    
    // Empêcher la suppression de l'année courante
    if (year.isCurrent) {
      return res.status(400).json({ message: 'Impossible de supprimer l\'année courante' });
    }
    
    // Vérifier s'il y a des classes liées
    const classCount = await Class.countDocuments({ academicYear: req.params.id });
    if (classCount > 0) {
      return res.status(400).json({ 
        message: `Impossible de supprimer cette année car elle contient ${classCount} classe(s)` 
      });
    }
    
    await AcademicYear.findByIdAndDelete(req.params.id);
    res.json({ message: 'Année académique supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- CLASSES ---

// @desc    Créer une classe
// @route   POST /api/admin/classes
exports.createClass = async (req, res) => {
  try {
    // Ex: code="ING4-ISI", yearId="..."
    const newClass = await Class.create(req.body); 
    res.status(201).json(newClass);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Obtenir les classes d'une année spécifique
// @route   GET /api/admin/classes/:yearId
exports.getClassesByYear = async (req, res) => {
  try {
    const classes = await Class.find({ academicYear: req.params.yearId });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obtenir toutes les classes
// @route   GET /api/admin/classes
exports.getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find().populate('academicYear');
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mettre à jour une classe
// @route   PUT /api/admin/classes/:id
exports.updateClass = async (req, res) => {
  try {
    const updatedClass = await Class.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('academicYear');
    
    if (!updatedClass) {
      return res.status(404).json({ message: 'Classe non trouvée' });
    }
    
    res.json(updatedClass);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Supprimer une classe
// @route   DELETE /api/admin/classes/:id
exports.deleteClass = async (req, res) => {
  try {
    const deletedClass = await Class.findByIdAndDelete(req.params.id);
    
    if (!deletedClass) {
      return res.status(404).json({ message: 'Classe non trouvée' });
    }
    
    res.json({ message: 'Classe supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- SEMESTRES ---

// @desc    Créer un semestre
// @route   POST /api/semesters
exports.createSemester = async (req, res) => {
  try {
    const { number, label, academicYear, startDate, endDate } = req.body;
    const semester = await Semester.create({ number, label, academicYear, startDate, endDate });
    res.status(201).json(semester);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Récupérer tous les semestres
// @route   GET /api/semesters
exports.getSemesters = async (req, res) => {
  try {
    const { academicYearId } = req.query;
    const filter = academicYearId ? { academicYear: academicYearId } : {};
    const semesters = await Semester.find(filter).populate({
      path: 'academicYear',
      options: { strictPopulate: false }
    }).sort({ number: 1 });
    res.json(semesters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Récupérer un semestre spécifique
// @route   GET /api/semesters/:id
exports.getSemester = async (req, res) => {
  try {
    const semester = await Semester.findById(req.params.id).populate({
      path: 'academicYear',
      options: { strictPopulate: false }
    }).catch(async (populateError) => {
      // Si le populate échoue, récupérer le semestre sans populate
      return await Semester.findById(req.params.id);
    });

    if (!semester) {
      return res.status(404).json({ message: 'Semestre non trouvé' });
    }

    res.json(semester);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du semestre' });
  }
};

// @desc    Mettre à jour un semestre
// @route   PUT /api/semesters/:id
exports.updateSemester = async (req, res) => {
  try {
    const semester = await Semester.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate({
      path: 'academicYear',
      options: { strictPopulate: false }
    }).catch(async (populateError) => {
      // Si le populate échoue, récupérer le semestre sans populate
      return await Semester.findById(req.params.id);
    });

    if (!semester) {
      return res.status(404).json({ message: 'Semestre non trouvé' });
    }

    res.json(semester);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Supprimer un semestre
// @route   DELETE /api/semesters/:id
exports.deleteSemester = async (req, res) => {
  try {
    const semester = await Semester.findByIdAndDelete(req.params.id);
    if (!semester) {
      return res.status(404).json({ message: 'Semestre non trouvé' });
    }
    res.json({ message: 'Semestre supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- COURS (UE) ---

// @desc    Créer un cours (UE)
// @route   POST /api/admin/courses
exports.createCourse = async (req, res) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json(course);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Lister tous les cours
// @route   GET /api/admin/courses
exports.getAllCourses = async (req, res) => {
  try {
    const { classId, semesterId, academicYearId } = req.query;
    let filter = {};

    if (classId) filter.classId = classId;
    if (semesterId) filter.semesterId = semesterId;

    const courses = await Course.find(filter)
      .populate('classId')
      .populate('semesterId');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Récupérer un cours par ID
// @route   GET /api/admin/courses/:id
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('classId')
      .populate('semesterId');
    
    if (!course) {
      return res.status(404).json({ message: 'Cours non trouvé' });
    }
    
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Lister les cours d'une classe
// @route   GET /api/admin/courses/:classId
exports.getCoursesByClass = async (req, res) => {
  try {
    const courses = await Course.find({ classId: req.params.classId })
      .populate('classId')
      .populate('semesterId');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mettre à jour un cours
// @route   PUT /api/admin/courses/:id
exports.updateCourse = async (req, res) => {
  try {
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('classId').populate('semesterId');
    
    if (!updatedCourse) {
      return res.status(404).json({ message: 'Cours non trouvé' });
    }
    
    res.json(updatedCourse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Supprimer un cours
// @route   DELETE /api/admin/courses/:id
exports.deleteCourse = async (req, res) => {
  try {
    const deletedCourse = await Course.findByIdAndDelete(req.params.id);
    
    if (!deletedCourse) {
      return res.status(404).json({ message: 'Cours non trouvé' });
    }
    
    res.json({ message: 'Cours supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Promouvoir les classes vers l'année suivante
// @route   POST /api/admin/classes/promote
exports.promoteClasses = async (req, res) => {
  try {
    const { sourceYearId, targetYearId } = req.body;

    // Récupérer les classes de l'année source
    const sourceClasses = await Class.find({ academicYear: sourceYearId });

    if (sourceClasses.length === 0) {
      return res.status(404).json({ message: 'Aucune classe trouvée pour l\'année source' });
    }

    // Créer les nouvelles classes pour l'année cible
    const promotedClasses = [];
    for (const sourceClass of sourceClasses) {
      // Incrémenter le niveau pour la promotion
      const newLevel = sourceClass.level + 1;
      
      // Générer un nouveau code basé sur le nouveau niveau
      const newCode = sourceClass.code.replace(/\d+/, newLevel);
      
      const newClass = await Class.create({
        code: newCode,
        speciality: sourceClass.speciality,
        level: newLevel,
        language: sourceClass.language,
        academicYear: targetYearId
      });
      promotedClasses.push(newClass);
    }

    res.status(201).json({
      message: `${promotedClasses.length} classes promues`,
      count: promotedClasses.length,
      classes: promotedClasses
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Calculer l'effectif d'une classe
// @route   GET /api/admin/classes/:id/students-count
exports.getClassStudentsCount = async (req, res) => {
  try {
    const User = require('../models/User');
    const count = await User.countDocuments({ 
      classId: req.params.id,
      role: 'STUDENT' 
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Récupérer les types d'évaluation
// @route   GET /api/evaluation-types
exports.getEvaluationTypes = async (req, res) => {
  try {
    // Types d'évaluation statiques pour l'instant
    const evaluationTypes = [
      {
        id: 'MI_PARCOURS',
        label: 'Mi-parcours',
        code: 'MI_PARCOURS',
        description: 'Évaluation de mi-parcours'
      },
      {
        id: 'FINAL',
        label: 'Final',
        code: 'FINAL',
        description: 'Évaluation finale'
      }
    ];

    res.json(evaluationTypes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};