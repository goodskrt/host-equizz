const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  text: { type: String, required: true },
  type: { type: String, enum: ['MCQ', 'OPEN', 'CLOSED'], required: true }, // QCM, Ouverte, Fermée (Oui/Non)
  options: [{ type: String }], // Pour QCM
  correctAnswer: { type: String } // Optionnel (pour l'auto-correction future)
});

const QuizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  type: { type: String, enum: ['MI_PARCOURS', 'FINAL'], required: true },
  status: { type: String, enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], default: 'DRAFT' },
  questions: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    textSnapshot: String, // Copie pour intégrité historique
    qType: String,
    optionsSnapshot: [String]
  }],
  deadline: { type: Date }
}, { timestamps: true });

module.exports = {
  Question: mongoose.model('Question', QuestionSchema),
  Quiz: mongoose.model('Quiz', QuizSchema)
};
