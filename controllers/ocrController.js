/**
 * CONTRÔLEUR OCR
 * 
 * Gestion de la reconnaissance de texte (OCR) pour les cartes étudiantes
 * - Upload et traitement d'images
 * - Extraction de texte avec Tesseract.js
 * - Parsing des informations de carte étudiant
 * - Validation des données extraites
 */

const multer = require('multer');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');

/**
 * CONFIGURATION MULTER
 * Gestion de l'upload des images
 */
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Vérifier le type de fichier
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non supporté. Utilisez JPEG, PNG ou WebP.'), false);
    }
  }
});

/**
 * PATTERNS DE RECONNAISSANCE MINIMAUX
 * Expressions régulières pour extraire seulement matricule et nom
 */
const CARD_PATTERNS = {
  // Pattern pour le matricule (ex: 2223i278)
  matricule: /(?:Matricule\s*:?\s*)?(\d{4}[a-zA-Z]\d{3})/i,
};

/**
 * PREPROCESSING D'IMAGE
 * Amélioration de l'image pour une meilleure reconnaissance OCR
 */
async function preprocessImage(imageBuffer) {
  try {
    console.log('🖼️ Preprocessing de l\'image...');
    
    const processedImage = await sharp(imageBuffer)
      .resize(1200, null, { 
        withoutEnlargement: true,
        fit: 'inside'
      })
      .grayscale()
      .normalize()
      .sharpen()
      .png()
      .toBuffer();
    
    console.log('✅ Image preprocessée avec succès');
    return processedImage;
    
  } catch (error) {
    console.error('❌ Erreur lors du preprocessing:', error);
    throw new Error('Erreur lors du traitement de l\'image');
  }
}

/**
 * RECONNAISSANCE OCR
 * Extraction du texte de l'image avec Tesseract
 */
async function performOCR(imageBuffer) {
  try {
    console.log('🔍 Démarrage de la reconnaissance OCR...');
    
    const { data: { text } } = await Tesseract.recognize(
      imageBuffer,
      'fra+eng', // Français et anglais
      {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789àáâãäåæçèéêëìíîïðñòóôõöùúûüýÿ ():.-',
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
      }
    );
    
    console.log('✅ OCR terminé avec succès');
    console.log('📝 Texte brut extrait:', text);
    
    return text;
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'OCR:', error);
    throw new Error('Erreur lors de la reconnaissance de texte');
  }
}

/**
 * NETTOYAGE DU TEXTE OCR
 * Correction des erreurs communes de reconnaissance
 */
function cleanOCRText(rawText) {
  let cleanedText = rawText;
  
  // Corrections communes d'OCR
  const corrections = [
    // Corrections pour les champs
    [/Matricule\s*[:;]\s*/gi, 'Matricule: '],
    [/Nom\s*\(s\)\s*[:;]\s*/gi, 'Nom(s): '],
    
    // Correction pour "Né(e)"
    [/Néfe?\)/gi, 'Né(e)'],
    
    // Nettoyage des espaces multiples
    [/\s+/g, ' '],
    [/\n\s*\n/g, '\n'],
  ];
  
  // Appliquer les corrections
  corrections.forEach(([pattern, replacement]) => {
    cleanedText = cleanedText.replace(pattern, replacement);
  });
  
  // Correction spéciale pour le matricule: remplacer le 5e caractère par 'i' s'il s'agit d'un chiffre
  // Pattern plus spécifique pour les matricules (4 chiffres + chiffre + 3 chiffres)
  cleanedText = cleanedText.replace(/\b(\d{4})(\d)(\d{3})\b/g, (match, p1, p2, p3) => {
    console.log(`🔧 Correction matricule: ${match} -> ${p1}i${p3}`);
    return `${p1}i${p3}`;
  });
  
  // Nettoyage final
  cleanedText = cleanedText.trim();
  
  console.log('🧹 Texte nettoyé:', cleanedText);
  return cleanedText;
}

/**
 * PARSING DES DONNÉES DE CARTE MINIMAL
 * Extraction seulement du matricule et du nom
 */
function parseCardData(text) {
  console.log('📋 Parsing des données de carte...');
  
  const cardData = {};
  
  // Extraction du matricule
  const matriculeMatch = text.match(CARD_PATTERNS.matricule);
  if (matriculeMatch) {
    cardData.matricule = matriculeMatch[1].toLowerCase();
    console.log('🎯 Matricule trouvé:', cardData.matricule);
  }
  
  // Extraction du nom - essayer plusieurs patterns
  let nameFound = false;
  
  // Pattern 1: Avec préfixe "Nom(s):"
  const nomMatch = text.match(/Nom\s*\(s\)\s*:?\s*([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s]+?)(?:\s+Né\(e\)|$)/i);
  if (nomMatch) {
    cardData.name = nomMatch[1].trim().toUpperCase();
    console.log('👤 Nom trouvé avec pattern principal:', cardData.name);
    nameFound = true;
  }
  
  // Pattern 2: Recherche directe de nom avant "Né(e)" (pour le cas "IGRE URBAIN LEPONTIFE NÉ(E) LE")
  if (!nameFound) {
    const directMatch = text.match(/([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\s]{3,}?)\s+NÉ\(E\)/i);
    if (directMatch) {
      cardData.name = directMatch[1].trim().toUpperCase();
      console.log('👤 Nom trouvé avec pattern direct:', cardData.name);
      nameFound = true;
    }
  }
  
  // Pattern 3: Recherche de nom après matricule et avant "Né(e)"
  if (!nameFound && cardData.matricule) {
    const afterMatriculeMatch = text.match(new RegExp(cardData.matricule + '\\s+([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ\\s]+?)\\s+NÉ\\(E\\)', 'i'));
    if (afterMatriculeMatch) {
      cardData.name = afterMatriculeMatch[1].trim().toUpperCase();
      console.log('👤 Nom trouvé après matricule:', cardData.name);
      nameFound = true;
    }
  }
  
  // Pattern 4: Fallback - recherche de séquence de mots en majuscules
  if (!nameFound) {
    const fallbackMatch = text.match(/([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ]{2,}\s+[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ]{2,}(?:\s+[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ]{2,})*)/);
    if (fallbackMatch) {
      const potentialName = fallbackMatch[1].trim();
      // Vérifier que ce n'est pas "INSTITUT SAINT JEAN" ou "CARTE D'ETUDIANT"
      if (!potentialName.includes('INSTITUT') && !potentialName.includes('CARTE') && !potentialName.includes('ETUDIANT')) {
        cardData.name = potentialName.toUpperCase();
        console.log('👤 Nom trouvé avec pattern fallback:', cardData.name);
        nameFound = true;
      }
    }
  }
  
  if (!nameFound) {
    console.log('❌ Aucun nom trouvé dans le texte');
  }
  
  return cardData;
}

/**
 * VALIDATION DES DONNÉES EXTRAITES MINIMALE
 * Vérification seulement du matricule et du nom
 */
function validateCardData(cardData) {
  const errors = [];
  
  // Validation du matricule
  if (!cardData.matricule) {
    errors.push('Matricule manquant');
  } else if (!/^\d{4}[a-zA-Z]\d{3}$/.test(cardData.matricule)) {
    errors.push('Format de matricule invalide');
  }
  
  // Validation du nom
  if (!cardData.name || cardData.name.length < 2) {
    errors.push('Nom manquant ou invalide');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * ENDPOINT: RECONNAISSANCE OCR
 * POST /api/ocr/recognize
 */
const recognizeCard = async (req, res) => {
  try {
    console.log('🚀 Démarrage de la reconnaissance de carte...');
    
    // Vérifier qu'un fichier a été uploadé
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucune image fournie'
      });
    }
    
    console.log('📁 Fichier reçu:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
    
    // 1. Preprocessing de l'image
    const processedImage = await preprocessImage(req.file.buffer);
    
    // 2. Reconnaissance OCR
    const rawText = await performOCR(processedImage);
    
    // 3. Nettoyage du texte
    const cleanedText = cleanOCRText(rawText);
    
    // 4. Parsing des données
    const cardData = parseCardData(cleanedText);
    
    // 5. Validation des données
    const validation = validateCardData(cardData);
    
    // 6. Réponse
    if (validation.isValid) {
      console.log('✅ Reconnaissance réussie:', cardData);
      
      res.json({
        success: true,
        message: 'Carte reconnue avec succès',
        data: {
          matricule: cardData.matricule,
          name: cardData.name,
          rawText: rawText,
          cleanedText: cleanedText
        }
      });
    } else {
      console.log('⚠️ Données incomplètes:', validation.errors);
      
      res.status(422).json({
        success: false,
        message: 'Données de carte incomplètes ou invalides',
        errors: validation.errors,
        data: {
          matricule: cardData.matricule || null,
          name: cardData.name || null,
          rawText: rawText,
          cleanedText: cleanedText
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la reconnaissance:', error);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la reconnaissance de la carte',
      error: error.message
    });
  }
};

/**
 * MIDDLEWARE D'UPLOAD
 */
const uploadMiddleware = upload.single('image');

module.exports = {
  recognizeCard,
  uploadMiddleware,
  // Fonctions utilitaires exportées pour les tests
  preprocessImage,
  performOCR,
  cleanOCRText,
  parseCardData,
  validateCardData
};