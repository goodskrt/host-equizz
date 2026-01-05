const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const { Class } = require('../models/Academic'); // Import du modèle Class pour le populate
const jwt = require('jsonwebtoken');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const emailService = require('../services/emailService');

// Import des fonctions OCR du contrôleur OCR
const { 
  preprocessImage, 
  performOCR, 
  cleanOCRText, 
  parseCardData, 
  validateCardData 
} = require('./ocrController');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

/**
 * CONFIGURATION MULTER POUR L'AUTHENTIFICATION PAR CARTE
 */
const storage = multer.memoryStorage();
const cardUpload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non supporté pour l\'authentification par carte.'), false);
    }
  }
});

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  const { identifier, password } = req.body; // identifier = email ou matricule
  
  try {
    // Chercher par email OU matricule
    const user = await User.findOne({ 
      $or: [{ email: identifier }, { matricule: identifier }] 
    }).populate('classId');

    if (user && (await user.matchPassword(password))) {
      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role.toLowerCase(),
            matricule: user.matricule,
            classId: user.classId,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          },
          token: generateToken(user._id)
        }
      });
    } else {
      res.status(401).json({ 
        success: false,
        error: 'Identifiants invalides' 
      });
    }
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur lors de la connexion' 
    });
  }
};

// @desc    Card Authentication with OCR
// @route   POST /api/auth/card-login
exports.cardLogin = async (req, res) => {
  try {
    console.log('🎓 Démarrage de l\'authentification par carte avec OCR...');
    
    // Vérifier qu'une image a été uploadée
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucune image de carte fournie'
      });
    }
    
    console.log('📁 Image de carte reçue:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
    
    // ÉTAPE 1: Preprocessing de l'image
    console.log('🖼️ Étape 1: Preprocessing de l\'image...');
    const processedImage = await preprocessImage(req.file.buffer);
    
    // ÉTAPE 2: Reconnaissance OCR
    console.log('🔍 Étape 2: Reconnaissance OCR...');
    const rawText = await performOCR(processedImage);
    
    // ÉTAPE 3: Nettoyage du texte
    console.log('🧹 Étape 3: Nettoyage du texte...');
    const cleanedText = cleanOCRText(rawText);
    
    // ÉTAPE 4: Parsing des données
    console.log('📋 Étape 4: Parsing des données...');
    const cardData = parseCardData(cleanedText);
    
    // ÉTAPE 5: Validation des données extraites
    console.log('✅ Étape 5: Validation des données...');
    const validation = validateCardData(cardData);
    
    if (!validation.isValid) {
      console.log('❌ Données de carte invalides:', validation.errors);
      return res.status(422).json({
        success: false,
        error: 'Impossible d\'extraire les informations nécessaires de la carte',
        details: validation.errors,
        extractedData: cardData,
        rawText: rawText,
        cleanedText: cleanedText
      });
    }
    
    // ÉTAPE 6: Recherche de l'utilisateur dans la base de données
    console.log('🔍 Étape 6: Recherche de l\'utilisateur...');
    const user = await User.findOne({ matricule: cardData.matricule }).populate('classId');
    
    if (!user) {
      console.log('❌ Aucun utilisateur trouvé avec le matricule:', cardData.matricule);
      return res.status(404).json({
        success: false,
        error: 'Aucun compte trouvé pour ce matricule. Veuillez contacter l\'administration.',
        extractedData: {
          matricule: cardData.matricule,
          name: cardData.name
        }
      });
    }
    
    // ÉTAPE 7: Vérification des informations
    console.log('🔍 Étape 7: Vérification des informations...');
    const fullName = `${user.firstName} ${user.lastName}`.toUpperCase();
    const cardName = cardData.name.toUpperCase();
    
    // Vérification flexible du nom (permet des variations mineures)
    const nameMatches = this.compareNames(fullName, cardName);
    
    if (!nameMatches) {
      console.log('❌ Le nom sur la carte ne correspond pas:', {
        expected: fullName,
        received: cardName
      });
      return res.status(401).json({
        success: false,
        error: 'Les informations de la carte ne correspondent pas à celles enregistrées',
        details: {
          expectedName: fullName,
          cardName: cardName
        }
      });
    }
    
    // ÉTAPE 8: Authentification réussie
    console.log('✅ Authentification par carte réussie pour:', user.email);
    
    res.json({
      success: true,
      message: 'Authentification par carte réussie',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role.toLowerCase(),
          matricule: user.matricule,
          classId: user.classId,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        token: generateToken(user._id),
        cardInfo: {
          matricule: cardData.matricule,
          name: cardData.name
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'authentification par carte:', error);
    
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de l\'authentification par carte',
      details: error.message
    });
  }
};

/**
 * Comparaison flexible des noms pour gérer les variations OCR
 */
exports.compareNames = function(expectedName, cardName) {
  // Normalisation des noms
  const normalize = (name) => {
    return name
      .toUpperCase()
      .replace(/[ÀÁÂÃÄÅ]/g, 'A')
      .replace(/[ÈÉÊË]/g, 'E')
      .replace(/[ÌÍÎÏ]/g, 'I')
      .replace(/[ÒÓÔÕÖ]/g, 'O')
      .replace(/[ÙÚÛÜ]/g, 'U')
      .replace(/[ÇÇ]/g, 'C')
      .replace(/[^A-Z\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };
  
  const normalizedExpected = normalize(expectedName);
  const normalizedCard = normalize(cardName);
  
  // Comparaison exacte
  if (normalizedExpected === normalizedCard) {
    return true;
  }
  
  // Comparaison par mots (ordre peut être différent)
  const expectedWords = normalizedExpected.split(' ').filter(w => w.length > 1);
  const cardWords = normalizedCard.split(' ').filter(w => w.length > 1);
  
  // Vérifier que tous les mots importants sont présents
  const matchingWords = expectedWords.filter(word => 
    cardWords.some(cardWord => 
      cardWord.includes(word) || word.includes(cardWord) || 
      this.levenshteinDistance(word, cardWord) <= 1
    )
  );
  
  // Au moins 70% des mots doivent correspondre
  const matchRatio = matchingWords.length / expectedWords.length;
  return matchRatio >= 0.7;
};

/**
 * Calcul de la distance de Levenshtein pour la comparaison de chaînes
 */
exports.levenshteinDistance = function(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

// @desc    Get user profile
// @route   GET /api/auth/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('classId').select('-password');
    
    if (user) {
      res.json({
        success: true,
        data: {
          id: user._id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role.toLowerCase(),
          matricule: user.matricule,
          classId: user.classId,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération du profil'
    });
  }
};

// @desc    Change password
// @route   POST /api/auth/change-password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  try {
    // Validation des données
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Mot de passe actuel et nouveau mot de passe requis'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
      });
    }
    
    // Récupérer l'utilisateur
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }
    
    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await user.matchPassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Mot de passe actuel incorrect'
      });
    }
    
    // Vérifier que le nouveau mot de passe est différent
    const isSamePassword = await user.matchPassword(newPassword);
    
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        error: 'Le nouveau mot de passe doit être différent de l\'ancien'
      });
    }
    
    // Mettre à jour le mot de passe
    user.password = newPassword;
    await user.save();
    
    console.log('✅ Mot de passe modifié pour l\'utilisateur:', user.email);
    
    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du changement de mot de passe:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors du changement de mot de passe'
    });
  }
};

// @desc    Register Student
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  const { matricule, email, password, firstName, lastName, classId } = req.body;

  try {
    // Validation email institutionnel (Règle métier)
    if (!email.endsWith('@institutsaintjean.org')) {
      return res.status(400).json({ 
        success: false,
        error: 'Email institutionnel requis' 
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ 
        success: false,
        error: 'Cet utilisateur existe déjà' 
      });
    }

    const user = await User.create({
      matricule, email, password, firstName, lastName, classId, role: 'STUDENT'
    });

    if (user) {
      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role.toLowerCase(),
            matricule: user.matricule,
            classId: user.classId,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          },
          token: generateToken(user._id)
        }
      });
    } else {
      res.status(400).json({ 
        success: false,
        error: 'Données invalides' 
      });
    }
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de l\'inscription'
    });
  }
};

// Export du middleware d'upload pour l'authentification par carte
exports.cardUploadMiddleware = cardUpload.single('cardImage');

// @desc    Request password reset code
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  
  try {
    // Validation de l'email
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Adresse email requise'
      });
    }
    
    // Vérifier que l'utilisateur existe
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Aucun compte associé à cette adresse email'
      });
    }
    
    // Générer un code à 6 chiffres
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Supprimer les anciens codes pour cet email
    await PasswordReset.deleteMany({ email: email.toLowerCase() });
    
    // Créer un nouveau code de réinitialisation
    await PasswordReset.create({
      email: email.toLowerCase(),
      code: resetCode
    });
    
    // Envoyer l'email avec le code
    await emailService.sendPasswordResetCode(email, resetCode, user.firstName);
    
    console.log('✅ Code de réinitialisation envoyé à:', email);
    
    res.json({
      success: true,
      message: 'Un code de vérification a été envoyé à votre adresse email'
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi du code de réinitialisation:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'envoi du code de vérification'
    });
  }
};

// @desc    Verify reset code
// @route   POST /api/auth/verify-reset-code
exports.verifyResetCode = async (req, res) => {
  const { email, code } = req.body;
  
  try {
    // Validation des données
    if (!email || !code) {
      return res.status(400).json({
        success: false,
        error: 'Email et code de vérification requis'
      });
    }
    
    // Chercher le code de réinitialisation
    const resetRecord = await PasswordReset.findOne({
      email: email.toLowerCase(),
      code: code,
      used: false,
      expiresAt: { $gt: new Date() }
    });
    
    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        error: 'Code de vérification invalide ou expiré'
      });
    }
    
    console.log('✅ Code de vérification validé pour:', email);
    
    res.json({
      success: true,
      message: 'Code de vérification valide'
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification du code:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la vérification du code'
    });
  }
};

// @desc    Reset password with code
// @route   POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  const { email, code, newPassword, confirmPassword } = req.body;
  
  try {
    // Validation des données
    if (!email || !code || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Tous les champs sont requis'
      });
    }
    
    // Vérifier que les mots de passe correspondent
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Les mots de passe ne correspondent pas'
      });
    }
    
    // Validation du mot de passe
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }
    
    // Chercher le code de réinitialisation
    const resetRecord = await PasswordReset.findOne({
      email: email.toLowerCase(),
      code: code,
      used: false,
      expiresAt: { $gt: new Date() }
    });
    
    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        error: 'Code de vérification invalide ou expiré'
      });
    }
    
    // Chercher l'utilisateur
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }
    
    // Mettre à jour le mot de passe
    user.password = newPassword;
    await user.save();
    
    // Marquer le code comme utilisé
    resetRecord.used = true;
    await resetRecord.save();
    
    // Supprimer tous les autres codes pour cet email
    await PasswordReset.deleteMany({ 
      email: email.toLowerCase(),
      _id: { $ne: resetRecord._id }
    });
    
    console.log('✅ Mot de passe réinitialisé pour:', email);
    
    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation du mot de passe:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la réinitialisation du mot de passe'
    });
  }
};