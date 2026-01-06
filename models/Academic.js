const mongoose = require('mongoose');

const AcademicYearSchema = new mongoose.Schema({
  label: { type: String, required: true }, // ex: "2025-2026"
  isCurrent: { type: Boolean, default: false }
}, { timestamps: true });

const SemesterSchema = new mongoose.Schema({
  number: { type: Number, required: true, enum: [1, 2] }, // 1 ou 2
  label: { type: String, required: true }, // ex: "Semestre 1"
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true }
}, { timestamps: true });

const ClassSchema = new mongoose.Schema({
  code: { type: String, required: true }, // ex: "ING4-ISI-FR"
  speciality: { type: String, required: true }, // ex: "ISI" (remplace name)
  level: { type: Number, required: true }, // ex: 4 (pour ING4)
  language: { type: String, enum: ['FR', 'EN'], default: 'FR' }, // Langue d'enseignement
  academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear' }
}, { timestamps: true });

// Index composé unique sur code + academicYear
ClassSchema.index({ code: 1, academicYear: 1 }, { unique: true });

const CourseSchema = new mongoose.Schema({
  code: { type: String, required: true }, // ex: "ISI4217"
  name: { type: String, required: true },
  credits: { type: Number, required: true },
  teacher: { type: String, required: true }, // Enseignant
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  semesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', required: true }
}, { timestamps: true });

module.exports = {
  AcademicYear: mongoose.model('AcademicYear', AcademicYearSchema),
  Semester: mongoose.model('Semester', SemesterSchema),
  Class: mongoose.model('Class', ClassSchema),
  Course: mongoose.model('Course', CourseSchema)
};
