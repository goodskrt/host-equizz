const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: false, // false pour port 587 avec STARTTLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      },
      requireTLS: process.env.SMTP_STARTTLS_REQUIRED === 'true'
    });
  }

  async sendPasswordResetCode(email, code, firstName = '') {
    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
      to: email,
      subject: 'Code de réinitialisation de mot de passe - EQuizz',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
            .code-box { background: white; border: 2px solid #2563eb; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .code { font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 4px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 EQuizz - Réinitialisation de mot de passe</h1>
            </div>
            <div class="content">
              <p>Bonjour ${firstName ? firstName : ''},</p>
              
              <p>Vous avez demandé la réinitialisation de votre mot de passe sur la plateforme EQuizz.</p>
              
              <p>Voici votre code de vérification :</p>
              
              <div class="code-box">
                <div class="code">${code}</div>
              </div>
              
              <div class="warning">
                <strong>⚠️ Important :</strong>
                <ul>
                  <li>Ce code est valide pendant <strong>15 minutes</strong></li>
                  <li>Ne partagez jamais ce code avec personne</li>
                  <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
                </ul>
              </div>
              
              <p>Saisissez ce code dans l'application pour continuer la réinitialisation de votre mot de passe.</p>
              
              <p>Cordialement,<br>
              L'équipe EQuizz<br>
              Institut Saint Jean</p>
            </div>
            <div class="footer">
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      // Créer un nouveau transporter pour chaque envoi (plus robuste)
      const transporter = require('nodemailer').createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: false, // false pour port 587 avec STARTTLS
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false
        },
        requireTLS: process.env.SMTP_STARTTLS_REQUIRED === 'true',
        connectionTimeout: 10000, // 10 secondes
        greetingTimeout: 5000,     // 5 secondes
        socketTimeout: 10000       // 10 secondes
      });

      const info = await transporter.sendMail(mailOptions);
      console.log('Email envoyé:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Erreur envoi email:', error);
      throw new Error('Impossible d\'envoyer l\'email de réinitialisation');
    }
  }

  // Méthode pour tester la connexion SMTP
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Connexion SMTP établie avec succès');
      return true;
    } catch (error) {
      console.error('❌ Erreur de connexion SMTP:', error);
      return false;
    }
  }
}

module.exports = new EmailService();