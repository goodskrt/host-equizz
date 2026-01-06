const { Quiz } = require('../models/Quiz');
const { Submission, SubmissionLog } = require('../models/Submission');
const User = require('../models/User');
const { AcademicYear, Class } = require('../models/Academic');

// @desc    Récupérer les quiz disponibles pour ma classe
// @route   GET /api/student/quizzes
exports.getMyQuizzes = async (req, res) => {
  try {
    // 1. Trouver les cours de ma classe
    const user = await User.findById(req.user._id);
    
    // 2. Trouver TOUS les quiz pour ces cours (nouveau mapping)
    // DRAFT = À faire, ARCHIVED = En cours, PUBLISHED = Terminés
    const quizzes = await Quiz.find({ 
      status: { $in: ['DRAFT', 'ARCHIVED', 'PUBLISHED'] } 
    })
      .populate({
         path: 'courseId',
         match: { classId: user.classId } // Filtre populate
      });

    // 3. Filtrer ceux avec un cours valide
    const validQuizzes = quizzes.filter(q => q.courseId !== null);

    res.json(validQuizzes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Soumettre un quiz
// @route   POST /api/student/submit
exports.submitQuiz = async (req, res) => {
  const { quizId, answers } = req.body;

  try {
    // 1. Vérifier doublon (Sécurité Backend)
    const existing = await SubmissionLog.findOne({ studentId: req.user._id, quizId });
    if (existing) {
      return res.status(400).json({ message: 'Quiz déjà soumis' });
    }

    // 2. Traitement IA sur les réponses ouvertes
    // 3. Sauvegarder la soumission ANONYME
    await Submission.create({
        quizId,
        answers: answers
    });

    // 4. Sauvegarder le LOG (Lien étudiant-quiz)
    await SubmissionLog.create({
        studentId: req.user._id,
        quizId
    });

    res.status(201).json({ message: 'Soumission réussie' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Récupérer les soumissions de l'étudiant connecté
// @route   GET /api/student/submissions
exports.getMySubmissions = async (req, res) => {
  try {
    // Récupérer toutes les soumissions de l'étudiant connecté
    const submissions = await SubmissionLog.find({ studentId: req.user._id });
    
    // Transformer en format simple pour le frontend
    const submissionData = submissions.map(sub => ({
      quizId: sub.quizId.toString(),
      submittedAt: sub.submittedAt
    }));
    
    res.json({
      success: true,
      data: submissionData
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des soumissions:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des soumissions'
    });
  }
};

// @desc    Récupérer les classes éligibles pour changement
// @route   GET /api/student/eligible-classes
exports.getEligibleClasses = async (req, res) => {
    try {
        console.log(`📚 Récupération des classes éligibles pour l'utilisateur: ${req.user._id}`);
        
        const student = await User.findById(req.user._id).populate({
            path: 'classId',
            populate: {
                path: 'academicYear'
            }
        });

        console.log(`👤 Utilisateur trouvé: ${student?.firstName} ${student?.lastName}`);
        console.log(`🏫 Classe ID: ${student?.classId?._id}`);

        if (!student || !student.classId) {
            console.log('❌ Aucune classe actuelle trouvée');
            return res.status(400).json({ message: "Aucune classe actuelle trouvée" });
        }

        const currentClass = student.classId;
        const currentAcademicYear = currentClass.academicYear;
        
        console.log(`🏫 Classe actuelle: ${currentClass.code}`);
        console.log(`📅 Année académique actuelle: ${currentAcademicYear?.label}`);
        
        // 1. Trouver l'année académique immédiatement supérieure
        const nextYear = await AcademicYear.findOne({
            label: { $gt: currentAcademicYear.label }
        }).sort({ label: 1 }); // Prendre la première année supérieure

        if (!nextYear) {
            return res.json({ 
                success: true,
                data: {
                    message: "Aucune année académique supérieure disponible",
                    currentClass: {
                        ...currentClass.toObject(),
                        academicYear: currentAcademicYear
                    },
                    eligibleClasses: []
                }
            });
        }

        console.log(`📅 Année suivante trouvée: ${nextYear.label}`);

        let eligibleClasses = [];

        // 2. Appliquer les règles selon le niveau actuel
        const currentLevel = currentClass.level;
        const currentSpeciality = currentClass.speciality;
        const currentLanguage = currentClass.language;

        console.log(`🔍 Classe actuelle: ${currentClass.code} (Niveau ${currentLevel}, ${currentSpeciality}, ${currentLanguage})`);

        // Option 1: Même classe avec année académique supérieure
        const sameClassNextYear = await Class.findOne({
            speciality: currentSpeciality,
            level: currentLevel,
            language: currentLanguage,
            academicYear: nextYear._id
        }).populate('academicYear');

        if (sameClassNextYear) {
            eligibleClasses.push({
                ...sameClassNextYear.toObject(),
                reason: `Même classe pour l'année ${nextYear.label}`
            });
            console.log(`✅ Même classe trouvée: ${sameClassNextYear.code}`);
        }

        // Option 2: Classes du niveau supérieur selon les règles
        let nextLevelClasses = [];

        if (currentLevel === 1) {
            // Niveau 1 → Niveau 2 (même spécialité, même langue)
            nextLevelClasses = await Class.find({
                level: 2,
                speciality: currentSpeciality,
                language: currentLanguage,
                academicYear: nextYear._id
            }).populate('academicYear');
            console.log(`🔍 Recherche niveau 2: spécialité=${currentSpeciality}, langue=${currentLanguage}`);
        } else if (currentLevel === 2) {
            // Niveau 2 → Niveau 3 (peu importe spécialité et langue)
            nextLevelClasses = await Class.find({
                level: 3,
                academicYear: nextYear._id
            }).populate('academicYear');
            console.log(`🔍 Recherche niveau 3: toutes spécialités et langues`);
        } else if (currentLevel === 3) {
            // Niveau 3 → Niveau 4 (même spécialité, même langue)
            nextLevelClasses = await Class.find({
                level: 4,
                speciality: currentSpeciality,
                language: currentLanguage,
                academicYear: nextYear._id
            }).populate('academicYear');
            console.log(`🔍 Recherche niveau 4: spécialité=${currentSpeciality}, langue=${currentLanguage}`);
        } else if (currentLevel === 4) {
            // Niveau 4 → Niveau 5 (même langue)
            nextLevelClasses = await Class.find({
                level: 5,
                language: currentLanguage,
                academicYear: nextYear._id
            }).populate('academicYear');
            console.log(`🔍 Recherche niveau 5: langue=${currentLanguage}`);
        }

        // Ajouter les classes du niveau supérieur
        for (const nextClass of nextLevelClasses) {
            eligibleClasses.push({
                ...nextClass.toObject(),
                reason: `Passage au niveau ${nextClass.level} pour l'année ${nextYear.label}`
            });
            console.log(`✅ Classe niveau supérieur trouvée: ${nextClass.code}`);
        }

        console.log(`📊 Total classes éligibles trouvées: ${eligibleClasses.length}`);

        // Supprimer les doublons basés sur l'ID (normalement pas nécessaire avec une seule année)
        const uniqueClasses = eligibleClasses.filter((classe, index, self) => 
            index === self.findIndex(c => c._id.toString() === classe._id.toString())
        );

        console.log(`📋 Classes éligibles finales: ${uniqueClasses.map(c => c.code).join(', ')}`);

        res.json({
            success: true,
            data: {
                currentClass: {
                    ...currentClass.toObject(),
                    academicYear: currentAcademicYear
                },
                eligibleClasses: uniqueClasses
            }
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des classes éligibles:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mettre à jour sa classe (Passage en année supérieure)
// @route   PUT /api/student/update-class
exports.updateClass = async (req, res) => {
    const { newClassId } = req.body;
    const studentId = req.user._id;

    try {
        const student = await User.findById(studentId).populate({
            path: 'classId',
            populate: {
                path: 'academicYear'
            }
        });
        
        // Validation basique (Vérifier que la classe existe, etc.)
        const newClass = await Class.findById(newClassId).populate('academicYear');
        if (!newClass) return res.status(404).json({ message: "Classe introuvable" });

        // Vérifier que la nouvelle classe est éligible
        const currentClass = student.classId;
        const currentAcademicYear = currentClass.academicYear;
        const newAcademicYear = newClass.academicYear;

        // Vérifier que c'est bien une année future
        if (newAcademicYear.label <= currentAcademicYear.label) {
            return res.status(400).json({ 
                message: "Vous ne pouvez changer que vers une année académique supérieure" 
            });
        }

        // Vérifier les règles de passage selon le niveau
        const isEligible = await validateClassChange(currentClass, newClass);
        if (!isEligible) {
            return res.status(400).json({ 
                message: "Cette classe n'est pas éligible selon les règles de passage" 
            });
        }

        // Mettre à jour la classe de l'étudiant
        student.classId = newClassId;
        await student.save();

        // Récupérer l'utilisateur mis à jour avec les données complètes
        const updatedStudent = await User.findById(studentId).populate({
            path: 'classId',
            populate: {
                path: 'academicYear'
            }
        });

        res.json({ 
            message: `Félicitations ! Vous êtes maintenant en ${newClass.code}`,
            user: {
                _id: updatedStudent._id,
                firstName: updatedStudent.firstName,
                lastName: updatedStudent.lastName,
                email: updatedStudent.email,
                matricule: updatedStudent.matricule,
                role: updatedStudent.role,
                classId: updatedStudent.classId
            }
        });

    } catch (error) {
        console.error('Erreur lors de la mise à jour de classe:', error);
        res.status(500).json({ message: error.message });
    }
};

// Fonction utilitaire pour valider le changement de classe
async function validateClassChange(currentClass, newClass) {
    const currentLevel = currentClass.level;
    const currentSpeciality = currentClass.speciality;
    const currentLanguage = currentClass.language;
    
    const newLevel = newClass.level;
    const newSpeciality = newClass.speciality;
    const newLanguage = newClass.language;

    // Cas 1: Même classe, année supérieure (toujours autorisé)
    if (currentLevel === newLevel && 
        currentSpeciality === newSpeciality && 
        currentLanguage === newLanguage) {
        return true;
    }

    // Cas 2: Passage au niveau supérieur
    if (currentLevel === 1 && newLevel === 2) {
        // Niveau 1 → 2: même spécialité, même langue
        return currentSpeciality === newSpeciality && currentLanguage === newLanguage;
    } else if (currentLevel === 2 && newLevel === 3) {
        // Niveau 2 → 3: peu importe spécialité et langue
        return true;
    } else if (currentLevel === 3 && newLevel === 4) {
        // Niveau 3 → 4: même spécialité, même langue
        return currentSpeciality === newSpeciality && currentLanguage === newLanguage;
    } else if (currentLevel === 4 && newLevel === 5) {
        // Niveau 4 → 5: même langue
        return currentLanguage === newLanguage;
    }

    return false;
}

// @desc    Enregistrer le token FCM (Notification) depuis le mobile
// @route   POST /api/student/fcm-token
exports.updateFcmToken = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, { fcmToken: req.body.token });
        res.json({ message: "Token mis à jour" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};