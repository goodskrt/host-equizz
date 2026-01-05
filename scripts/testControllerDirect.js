/**
 * Test direct des contrôleurs sans passer par HTTP
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const { SubmissionLog } = require('../models/Submission');
const studentController = require('../controllers/studentController');

async function testControllerDirect() {
    try {
        console.log('🔗 Connexion à MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connecté à MongoDB');

        // Trouver l'étudiant 2223i278
        const student = await User.findOne({ matricule: '2223i278' });
        if (!student) {
            console.log('❌ Étudiant 2223i278 non trouvé');
            return;
        }

        console.log('👤 Étudiant trouvé:', student.firstName, student.lastName);

        // Simuler une requête pour getMyQuizzes
        console.log('\n📝 Test de getMyQuizzes...');
        const mockReq1 = {
            user: student
        };
        const mockRes1 = {
            json: (data) => {
                console.log('📊 Réponse getMyQuizzes:');
                console.log('Nombre de quiz:', data.length);
                if (data.length > 0) {
                    console.log('Premier quiz:', {
                        id: data[0]._id,
                        title: data[0].title,
                        status: data[0].status,
                        deadline: data[0].deadline
                    });
                }
                return data;
            },
            status: (code) => ({
                json: (data) => {
                    console.log('❌ Erreur getMyQuizzes:', code, data);
                    return data;
                }
            })
        };

        await studentController.getMyQuizzes(mockReq1, mockRes1);

        // Simuler une requête pour getMySubmissions
        console.log('\n📋 Test de getMySubmissions...');
        const mockReq2 = {
            user: student
        };
        const mockRes2 = {
            json: (data) => {
                console.log('📊 Réponse getMySubmissions:');
                console.log(JSON.stringify(data, null, 2));
                return data;
            },
            status: (code) => ({
                json: (data) => {
                    console.log('❌ Erreur getMySubmissions:', code, data);
                    return data;
                }
            })
        };

        await studentController.getMySubmissions(mockReq2, mockRes2);

        // Vérifier directement les soumissions dans la base
        console.log('\n🔍 Vérification directe des soumissions...');
        const submissions = await SubmissionLog.find({ studentId: student._id });
        console.log('📋 Soumissions trouvées:', submissions.length);
        submissions.forEach(sub => {
            console.log(`  - Quiz: ${sub.quizId}, Soumis le: ${sub.submittedAt}`);
        });

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Déconnecté de MongoDB');
    }
}

testControllerDirect();