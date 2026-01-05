/**
 * Script de test pour vérifier la configuration SMTP
 */

require('dotenv').config();
const emailService = require('../services/emailService');

const testEmailConnection = async () => {
  console.log('🧪 Test de la configuration SMTP...');
  console.log('Configuration:');
  console.log('- Host:', process.env.SMTP_HOST);
  console.log('- Port:', process.env.SMTP_PORT);
  console.log('- User:', process.env.SMTP_USER);
  console.log('- Pass:', process.env.SMTP_PASS ? '***' : 'Non défini');
  
  try {
    // Test de connexion
    const isConnected = await emailService.testConnection();
    
    if (isConnected) {
      console.log('✅ Connexion SMTP réussie');
      
      // Test d'envoi d'email
      console.log('📧 Test d\'envoi d\'email...');
      await emailService.sendPasswordResetCode('igre.urbain@institutsaintjean.org', '123456', 'IGRE');
      console.log('✅ Email envoyé avec succès');
    } else {
      console.log('❌ Échec de la connexion SMTP');
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('Détails:', error);
  }
};

testEmailConnection();