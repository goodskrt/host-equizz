const admin = require('firebase-admin');

// Vérification pour éviter de crasher si le fichier n'est pas encore là
let isInitialized = false;

// ✅ En test, on mock directement
if (process.env.NODE_ENV === 'test') {
  exports.sendPushNotification = async () => {
    // silence en test
  };
} else {
    try {
        // Placez votre fichier json téléchargé depuis Firebase dans le dossier config
        const serviceAccount = require('../config/serviceAccountKey.json');
        
        admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
        });
        isInitialized = true;
        console.log("Firebase Admin Initialisé");
    } catch (error) {
        console.warn("ATTENTION: Firebase non configuré. Les notifications seront simulées (logs).");
    }

    exports.sendPushNotification = async (tokens, title, body, data = {}) => {
        if (!isInitialized || !tokens || tokens.length === 0) {
            console.log(`[MOCK PUSH] Vers ${tokens?.length} appareils : ${title} - ${body}`);
            return;
        }

        try {
            // Pour un seul token
            if (tokens.length === 1) {
                const message = {
                    notification: { title, body },
                    data: data,
                    token: tokens[0]
                };
                
                const response = await admin.messaging().send(message);
                console.log(`Notification envoyée avec succès:`, response);
            } else {
                // Pour plusieurs tokens
                const message = {
                    notification: { title, body },
                    data: data,
                    tokens: tokens
                };
                
                const response = await admin.messaging().sendEachForMulticast(message);
                console.log(`Notifications envoyées: ${response.successCount} succès, ${response.failureCount} échecs.`);
            }
        } catch (error) {
            console.error('Erreur envoi notification:', error);
        }
    };
}
