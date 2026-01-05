/**
 * SCRIPT: createSubmissionCheckAPI.js
 * 
 * Crée un endpoint pour vérifier les soumissions d'un étudiant
 * Endpoint: GET /api/student/submissions/:studentId
 */

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Modèles
const { SubmissionLog } = require('../models/Submission');

/**
 * Endpoint pour récupérer les soumissions d'un étudiant
 * GET /api/student/submissions/:studentId
 */
async function getStudentSubmissions(req, res) {
    try {
        const { studentId } = req.params;
        
        // Récupérer toutes les soumissions de l'étudiant
        const submissions = await SubmissionLog.find({ studentId });
        
        // Transformer en format simple
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
            error: 'Erreur serveur'
        });
    }
}

// Test de l'endpoint
async function testSubmissionAPI() {
    try {
        // Connexion à MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connecté à MongoDB');

        // Simuler une requête pour l'étudiant 2223i278
        const User = require('../models/User');
        const student = await User.findOne({ matricule: '2223i278' });
        
        if (!student) {
            console.log('❌ Étudiant non trouvé');
            return;
        }

        console.log(`👤 Test pour étudiant: ${student.name} (${student.matricule})`);
        console.log(`📝 ID étudiant: ${student._id}`);

        // Simuler l'appel API
        const submissions = await SubmissionLog.find({ studentId: student._id });
        
        const submissionData = submissions.map(sub => ({
            quizId: sub.quizId.toString(),
            submittedAt: sub.submittedAt
        }));
        
        const mockResponse = {
            success: true,
            data: submissionData
        };

        console.log('\n📡 RÉPONSE API SIMULÉE:');
        console.log('='.repeat(40));
        console.log(JSON.stringify(mockResponse, null, 2));
        
        console.log('\n📊 RÉSUMÉ:');
        console.log('='.repeat(20));
        console.log(`📝 Soumissions trouvées: ${submissionData.length}`);
        submissionData.forEach((sub, index) => {
            console.log(`  ${index + 1}. Quiz: ${sub.quizId} | Soumis: ${new Date(sub.submittedAt).toLocaleDateString()}`);
        });

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Déconnecté de MongoDB');
    }
}

// Exporter pour utilisation dans le serveur
module.exports = { getStudentSubmissions };

// Exécuter le test si appelé directement
if (require.main === module) {
    testSubmissionAPI();
}