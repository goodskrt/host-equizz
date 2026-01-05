const { Submission } = require('../models/Submission');
const { Quiz } = require('../models/Quiz');
const mongoose = require('mongoose');

// @desc    Stats globales pour un Quiz (Admin)
// @route   GET /api/stats/quiz/:quizId
exports.getQuizStats = async (req, res) => {
  const { quizId } = req.params;

  try {
    const stats = await Submission.aggregate([
      { $match: { quizId: new mongoose.Types.ObjectId(quizId) } },
      
      // Groupe 1: Stats globales du quiz
      {
        $group: {
          _id: "$quizId",
          totalSubmissions: { $sum: 1 },
          avgSentiment: { $avg: "$sentimentAnalysis.score" } // Moyenne sentiment global
        }
      }
    ]);

    // Récupérer le détail des réponses pour les graphes
    // Note: C'est une requête lourde, à optimiser en prod
    const submissions = await Submission.find({ quizId }).select('answers sentimentAnalysis');
    
    // Calculer la répartition des sentiments (Positif/Neutre/Négatif)
    let sentimentDistribution = { positive: 0, neutral: 0, negative: 0 };
    
    submissions.forEach(sub => {
        const score = sub.sentimentAnalysis.score;
        if (score > 0.25) sentimentDistribution.positive++;
        else if (score < -0.25) sentimentDistribution.negative++;
        else sentimentDistribution.neutral++;
    });

    res.json({
      overview: stats[0] || { totalSubmissions: 0, avgSentiment: 0 },
      sentimentDistribution
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
