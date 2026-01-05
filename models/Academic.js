const mongoose = require('mongoose');

const AcademicYearSchema = new mongoose.Schema({
  label: { type: String, required: true }, // ex: "2025-2026"
  isCurrent: { type: Boolean, default: false }
});

const ClassSchema = new mongoose.Schema({
  code: { type: String, required: true }, // ex: "ING4-ISI-FR"
  speciality: { type: String, required: true }, // ex: "ISI" (remplace name)
  level: { type: Number, required: true }, // ex: 4 (pour ING4)
  language: { type: String, enum: ['FR', 'EN'], default: 'FR' }, // Langue d'enseignement
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear' }
});

// Index composé unique sur code + academicYear
ClassSchema.index({ code: 1, academicYear: 1 }, { unique: true });

const CourseSchema = new mongoose.Schema({
  code: { type: String, required: true }, // ex: "ISI4217"
  name: { type: String, required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  semester: { type: Number, required: true } // 1 ou 2
});

module.exports = {
  AcademicYear: mongoose.model('AcademicYear', AcademicYearSchema),
  Class: mongoose.model('Class', ClassSchema),
  Course: mongoose.model('Course', CourseSchema)
};
