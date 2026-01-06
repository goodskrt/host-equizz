const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  type: { type: String, enum: ['MCQ', 'OPEN', 'CLOSED'], required: true }, // QCM, Ouverte, Fermée (Oui/Non)
  options: [{
    text: { type: String, required: true },
    order: { type: Number, required: true }
  }], // Pour QCM
  correctAnswer: { type: String }, // Optionnel (pour l'auto-correction future)
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

const QuizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  semesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester' },
  type: { type: String, enum: ['MI_PARCOURS', 'FINAL'], required: true },
  status: { type: String, enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], default: 'DRAFT' },
  questions: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    textSnapshot: String, // Copie pour intégrité historique
    qType: String,
    optionsSnapshot: [String] // Tableau de strings pour compatibilité mobile
  }],
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  deadline: { type: Date } // Alias pour endDate pour compatibilité
}, { timestamps: true });

module.exports = {
  Question: mongoose.model('Question', QuestionSchema),
  Quiz: mongoose.model('Quiz', QuizSchema)
};
