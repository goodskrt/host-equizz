const { sendPushNotification } = require('../utils/firebaseService');
const User = require('../models/User');
const { Quiz } = require('../models/Quiz');

/**
 * Enregistrer un token FCM pour un utilisateur
 */
const registerFCMToken = async (req, res) => {
    try {
        const { token } = req.body;
        const userId = req.user.id;

        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Token FCM requis'
            });
        }

        // Mettre à jour le token FCM de l'utilisateur
        await User.findByIdAndUpdate(userId, {
            fcmToken: token,
            fcmTokenUpdatedAt: new Date()
        });

        console.log(`📱 Token FCM enregistré pour l'utilisateur ${userId}`);

        res.json({
            success: true,
            message: 'Token FCM enregistré avec succès'
        });

    } catch (error) {
        console.error('❌ Erreur enregistrement token FCM:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de l\'enregistrement du token'
        });
    }
};

/**
 * Envoyer une notification de soumission de quiz
 */
const notifyQuizSubmitted = async (req, res) => {
    try {
        const { quizId, isFromQueue = false } = req.body;
        const userId = req.user.id;

        // Récupérer les informations du quiz
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                error: 'Quiz non trouvé'
            });
        }

        // Récupérer l'utilisateur et son token FCM
        const user = await User.findById(userId);
        if (!user || !user.fcmToken) {
            return res.status(400).json({
                success: false,
                error: 'Token FCM non trouvé pour cet utilisateur'
            });
        }

        // Préparer le message de notification
        const title = 'Quiz soumis !';
        const body = isFromQueue 
            ? `Quiz "${quiz.title}" soumis depuis la file d'attente hors ligne`
            : `Quiz "${quiz.title}" soumis avec succès`;

        const data = {
            type: 'QUIZ_SUBMITTED',
            quizId: quizId,
            quizTitle: quiz.title,
            isFromQueue: isFromQueue.toString()
        };

        // Envoyer la notification
        await sendPushNotification([user.fcmToken], title, body, data);

        console.log(`🔔 Notification de soumission envoyée à ${user.firstName} ${user.lastName}`);

        res.json({
            success: true,
            message: 'Notification envoyée avec succès'
        });

    } catch (error) {
        console.error('❌ Erreur envoi notification soumission:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de l\'envoi de la notification'
        });
    }
};

/**
 * Programmer les notifications d'expiration de quiz
 */
const scheduleQuizExpirationNotifications = async (req, res) => {
    try {
        const { quizId } = req.body;
        const userId = req.user.id;

        // Récupérer les informations du quiz
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                error: 'Quiz non trouvé'
            });
        }

        if (!quiz.deadline) {
            return res.status(400).json({
                success: false,
                error: 'Quiz sans date limite'
            });
        }

        // Récupérer l'utilisateur et son token FCM
        const user = await User.findById(userId);
        if (!user || !user.fcmToken) {
            return res.status(400).json({
                success: false,
                error: 'Token FCM non trouvé pour cet utilisateur'
            });
        }

        // Calculer les dates de notification (-5, -2, -1 jours)
        const deadline = new Date(quiz.deadline);
        const now = new Date();
        const notifications = [];

        const notificationDays = [5, 2, 1];
        
        for (const days of notificationDays) {
            const notificationDate = new Date(deadline.getTime() - (days * 24 * 60 * 60 * 1000));
            
            if (notificationDate > now) {
                notifications.push({
                    date: notificationDate,
                    days: days,
                    title: `Quiz expire bientôt !`,
                    body: `Quiz "${quiz.title}" expire dans ${days} jour${days > 1 ? 's' : ''}`,
                    data: {
                        type: 'QUIZ_EXPIRING',
                        quizId: quizId,
                        quizTitle: quiz.title,
                        daysRemaining: days.toString()
                    }
                });
            }
        }

        // TODO: Programmer les notifications avec un système de tâches (comme node-cron)
        // Pour l'instant, on simule la programmation
        console.log(`📅 ${notifications.length} notifications d'expiration programmées pour "${quiz.title}"`);
        
        res.json({
            success: true,
            message: `${notifications.length} notifications programmées`,
            scheduledNotifications: notifications.map(n => ({
                date: n.date,
                days: n.days
            }))
        });

    } catch (error) {
        console.error('❌ Erreur programmation notifications expiration:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur lors de la programmation des notifications'
        });
    }
};

/**
 * Envoyer des notifications d'expiration (appelé par un cron job)
 */
const sendExpirationNotifications = async () => {
    try {
        console.log('⏰ Vérification des quiz expirant...');

        // Récupérer tous les quiz avec une deadline dans les 5 prochains jours
        const fiveDaysFromNow = new Date();
        fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);

        const expiringQuizzes = await Quiz.find({
            deadline: {
                $gte: new Date(),
                $lte: fiveDaysFromNow
            },
            status: 'PUBLISHED'
        });

        console.log(`📋 ${expiringQuizzes.length} quiz expirant dans les 5 prochains jours`);

        for (const quiz of expiringQuizzes) {
            const deadline = new Date(quiz.deadline);
            const now = new Date();
            const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            // Envoyer notification si c'est 5, 2 ou 1 jour(s) avant
            if ([5, 2, 1].includes(daysRemaining)) {
                // Récupérer tous les utilisateurs avec des tokens FCM
                const users = await User.find({
                    fcmToken: { $exists: true, $ne: null }
                });

                const tokens = users.map(user => user.fcmToken).filter(Boolean);

                if (tokens.length > 0) {
                    const title = `Quiz expire bientôt !`;
                    const body = `Quiz "${quiz.title}" expire dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}`;
                    
                    const data = {
                        type: 'QUIZ_EXPIRING',
                        quizId: quiz._id.toString(),
                        quizTitle: quiz.title,
                        daysRemaining: daysRemaining.toString()
                    };

                    await sendPushNotification(tokens, title, body, data);
                    console.log(`🔔 Notification d'expiration envoyée à ${tokens.length} utilisateurs pour "${quiz.title}"`);
                }
            }
        }

    } catch (error) {
        console.error('❌ Erreur envoi notifications expiration:', error);
    }
};

module.exports = {
    registerFCMToken,
    notifyQuizSubmitted,
    scheduleQuizExpirationNotifications,
    sendExpirationNotifications
};