const { AcademicYear, Class, Course } = require('../models/Academic');

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
  const years = await AcademicYear.find().sort({ startDate: -1 });
  res.json(years);
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

// @desc    Lister les cours d'une classe
// @route   GET /api/admin/courses/:classId
exports.getCoursesByClass = async (req, res) => {
  try {
    const courses = await Course.find({ classId: req.params.classId });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
