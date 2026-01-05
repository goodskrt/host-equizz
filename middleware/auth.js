const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Utilisateur introuvable' });
      }

      return next(); // ✅ STOP ICI
    } catch (error) {
      return res.status(401).json({ message: 'Non autorisé, token invalide' });
    }
  }

  return res.status(401).json({ message: 'Non autorisé, pas de token' });
};

const adminOnly = (req, res, next) => {
  if (req.user.role === 'ADMIN') {
    return next();
  }
  return res.status(403).json({ message: 'Accès réservé aux administrateurs' });
};

module.exports = { protect, adminOnly };
