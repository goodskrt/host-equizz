/**
 * Script complet pour vider et repeupler la base de données
 * Combine tous les seeds nécessaires pour l'application
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Modèles
const User = require('../models/User');
const { AcademicYear, Class, Course } = require('../models/Academic');
const { Quiz } = require('../models/Quiz');
const { Submission, SubmissionLog } = require('../models/Submission');
const PasswordReset = require('../models/PasswordReset');

// Configuration de la base de données
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/equizz';

async function resetAndSeedDatabase() {
    try {
        // Connexion à MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connecté à MongoDB');

        // ========================================
        // 1. NETTOYAGE COMPLET DE LA BASE
        // ========================================
        console.log('\n🧹 NETTOYAGE COMPLET DE LA BASE DE DONNÉES...');
        
        await PasswordReset.deleteMany({});
        console.log('  ✅ PasswordReset vidé');
        
        await SubmissionLog.deleteMany({});
        console.log('  ✅ SubmissionLog vidé');
        
        await Submission.deleteMany({});
        console.log('  ✅ Submission vidé');
        
        await Quiz.deleteMany({});
        console.log('  ✅ Quiz vidé');
        
        await Course.deleteMany({});
        console.log('  ✅ Course vidé');
        
        await User.deleteMany({});
        console.log('  ✅ User vidé');
        
        await Class.deleteMany({});
        console.log('  ✅ Class vidé');
        
        await AcademicYear.deleteMany({});
        console.log('  ✅ AcademicYear vidé');

        console.log('🗑️ Base de données complètement vidée');

        // ========================================
        // 2. CRÉATION DES ANNÉES ACADÉMIQUES
        // ========================================
        console.log('\n📅 CRÉATION DES ANNÉES ACADÉMIQUES...');
        
        const years = [
            { label: '2023-2024', isCurrent: false },
            { label: '2024-2025', isCurrent: true },
            { label: '2025-2026', isCurrent: false },
            { label: '2026-2027', isCurrent: false },
        ];

        const createdYears = [];
        for (const yearData of years) {
            const year = await AcademicYear.create(yearData);
            createdYears.push(year);
            console.log(`  ✅ Année créée: ${year.label} ${year.isCurrent ? '(courante)' : ''}`);
        }

        // ========================================
        // 3. CRÉATION DES CLASSES
        // ========================================
        console.log('\n🏫 CRÉATION DES CLASSES...');
        
        const classTemplates = [
            // Niveau 1
            { code: 'ING1-GEN-FR', speciality: 'GEN', level: 1, language: 'FR' },
            { code: 'ING1-GEN-EN', speciality: 'GEN', level: 1, language: 'EN' },
            { code: 'ING1-ISI-FR', speciality: 'ISI', level: 1, language: 'FR' },
            { code: 'ING1-ISI-EN', speciality: 'ISI', level: 1, language: 'EN' },
            
            // Niveau 2
            { code: 'ING2-GEN-FR', speciality: 'GEN', level: 2, language: 'FR' },
            { code: 'ING2-GEN-EN', speciality: 'GEN', level: 2, language: 'EN' },
            { code: 'ING2-ISI-FR', speciality: 'ISI', level: 2, language: 'FR' },
            { code: 'ING2-ISI-EN', speciality: 'ISI', level: 2, language: 'EN' },
            
            // Niveau 3
            { code: 'ING3-ISI-FR', speciality: 'ISI', level: 3, language: 'FR' },
            { code: 'ING3-ISI-EN', speciality: 'ISI', level: 3, language: 'EN' },
            { code: 'ING3-GI-FR', speciality: 'GI', level: 3, language: 'FR' },
            { code: 'ING3-GI-EN', speciality: 'GI', level: 3, language: 'EN' },
            { code: 'ING3-RT-FR', speciality: 'RT', level: 3, language: 'FR' },
            { code: 'ING3-RT-EN', speciality: 'RT', level: 3, language: 'EN' },
            
            // Niveau 4
            { code: 'ING4-ISI-FR', speciality: 'ISI', level: 4, language: 'FR' },
            { code: 'ING4-ISI-EN', speciality: 'ISI', level: 4, language: 'EN' },
            { code: 'ING4-GI-FR', speciality: 'GI', level: 4, language: 'FR' },
            { code: 'ING4-GI-EN', speciality: 'GI', level: 4, language: 'EN' },
            { code: 'ING4-RT-FR', speciality: 'RT', level: 4, language: 'FR' },
            { code: 'ING4-RT-EN', speciality: 'RT', level: 4, language: 'EN' },
            
            // Niveau 5
            { code: 'ING5-ISI-FR', speciality: 'ISI', level: 5, language: 'FR' },
            { code: 'ING5-ISI-EN', speciality: 'ISI', level: 5, language: 'EN' },
            { code: 'ING5-GI-FR', speciality: 'GI', level: 5, language: 'FR' },
            { code: 'ING5-GI-EN', speciality: 'GI', level: 5, language: 'EN' },
            { code: 'ING5-RT-FR', speciality: 'RT', level: 5, language: 'FR' },
            { code: 'ING5-RT-EN', speciality: 'RT', level: 5, language: 'EN' },
        ];

        const createdClasses = [];
        for (const year of createdYears) {
            for (const template of classTemplates) {
                const newClass = await Class.create({
                    ...template,
                    academicYear: year._id
                });
                createdClasses.push(newClass);
                console.log(`  ✅ Classe créée: ${newClass.code} (${year.label})`);
            }
        }

        console.log(`📊 Total: ${createdClasses.length} classes créées`);

        // ========================================
        // 4. CRÉATION DES COURS
        // ========================================
        console.log('\n📚 CRÉATION DES COURS...');
        
        // Trouver la classe ING4-ISI-FR de l'année courante pour les cours
        const currentYear = createdYears.find(y => y.isCurrent);
        const mainClass = createdClasses.find(c => 
            c.code === 'ING4-ISI-FR' && 
            c.academicYear.toString() === currentYear._id.toString()
        );

        const courses = [
            { code: 'ISI4217', name: 'Développement Mobile', classId: mainClass._id, semester: 1 },
            { code: 'ISI4218', name: 'Intelligence Artificielle', classId: mainClass._id, semester: 1 },
            { code: 'ISI4219', name: 'Sécurité Informatique', classId: mainClass._id, semester: 2 },
            { code: 'ISI4220', name: 'Base de Données Avancées', classId: mainClass._id, semester: 2 },
            { code: 'ISI4221', name: 'Génie Logiciel', classId: mainClass._id, semester: 1 },
            { code: 'ISI4222', name: 'Réseaux et Télécommunications', classId: mainClass._id, semester: 2 },
            { code: 'ISI4223', name: 'Architecture des Systèmes', classId: mainClass._id, semester: 1 },
            { code: 'ISI4224', name: 'Machine Learning', classId: mainClass._id, semester: 2 },
        ];

        const createdCourses = await Course.insertMany(courses);
        console.log(`  ✅ ${createdCourses.length} cours créés pour ${mainClass.code}`);

        // ========================================
        // 5. CRÉATION DES UTILISATEURS
        // ========================================
        console.log('\n👥 CRÉATION DES UTILISATEURS...');

        // Admin
        const admin = await User.create({
            email: 'admin@institut.fr',
            firstName: 'Admin',
            lastName: 'Système',
            password: 'password123',
            role: 'ADMIN'
        });
        console.log(`  ✅ Admin créé: ${admin.email}`);

        // Utilisateur de test principal (ING1-GEN-FR pour tester les changements de classe)
        const testClass = createdClasses.find(c => 
            c.code === 'ING1-GEN-FR' && 
            c.academicYear.toString() === currentYear._id.toString()
        );

        const testStudent = await User.create({
            email: 'test.student@example.com',
            firstName: 'Test',
            lastName: 'Student',
            matricule: 'TEST001',
            password: 'password123',
            role: 'STUDENT',
            classId: testClass._id
        });
        console.log(`  ✅ Étudiant de test créé: ${testStudent.email} (${testClass.code})`);

        // Étudiant principal pour ING4-ISI-FR (pour les quiz et évaluations)
        const mainStudent = await User.create({
            email: 'igre.urbain@institutsaintjean.org',
            firstName: 'IGRE',
            lastName: 'URBAIN LEPONTIFE',
            matricule: '2223i278',
            password: 'password123',
            role: 'STUDENT',
            classId: mainClass._id
        });
        console.log(`  ✅ Étudiant principal créé: ${mainStudent.email} (${mainClass.code})`);

        // Étudiants supplémentaires pour ING4-ISI-FR
        const additionalStudents = [];
        for (let i = 2; i <= 15; i++) {
            const student = await User.create({
                email: `etudiant${i}@institut.fr`,
                firstName: `Étudiant`,
                lastName: `${i}`,
                matricule: `2024i${i.toString().padStart(3, '0')}`,
                password: 'password123',
                role: 'STUDENT',
                classId: mainClass._id
            });
            additionalStudents.push(student);
        }
        console.log(`  ✅ ${additionalStudents.length} étudiants supplémentaires créés pour ${mainClass.code}`);

        // ========================================
        // 6. CRÉATION DES QUIZ AVEC PLUS DE QUESTIONS
        // ========================================
        console.log('\n📝 CRÉATION DES QUIZ AVEC QUESTIONS DÉTAILLÉES...');

        const quizzes = [];
        const now = new Date();

        // Questions détaillées par matière
        const questionsBySubject = {
            'Développement Mobile': {
                mcq: [
                    {
                        text: 'Quel est le langage principal utilisé pour développer des applications Android natives ?',
                        options: ['Java', 'Swift', 'Python', 'Ruby'],
                        correct: 0
                    },
                    {
                        text: 'Quelle technologie permet de développer des applications multiplateformes ?',
                        options: ['React Native', 'Android Studio', 'Xcode', 'Eclipse'],
                        correct: 0
                    },
                    {
                        text: 'Qu\'est-ce qu\'une API REST ?',
                        options: ['Un protocole de communication', 'Un langage de programmation', 'Un système d\'exploitation', 'Une base de données'],
                        correct: 0
                    },
                    {
                        text: 'Quel composant Android gère l\'interface utilisateur ?',
                        options: ['Activity', 'Service', 'Broadcast Receiver', 'Content Provider'],
                        correct: 0
                    },
                    {
                        text: 'Quelle est la différence entre une application native et hybride ?',
                        options: ['Performance et accès aux fonctionnalités', 'Couleur de l\'interface', 'Taille de l\'application', 'Prix de développement'],
                        correct: 0
                    }
                ],
                open: [
                    'Expliquez les avantages et inconvénients du développement mobile natif vs hybride.',
                    'Décrivez le cycle de vie d\'une Activity Android.',
                    'Comment optimisez-vous les performances d\'une application mobile ?',
                    'Quelles sont les meilleures pratiques pour la sécurité mobile ?'
                ]
            },
            'Intelligence Artificielle': {
                mcq: [
                    {
                        text: 'Qu\'est-ce que l\'apprentissage supervisé ?',
                        options: ['Apprentissage avec données étiquetées', 'Apprentissage sans données', 'Apprentissage par renforcement', 'Apprentissage génétique'],
                        correct: 0
                    },
                    {
                        text: 'Quel algorithme est utilisé pour la classification ?',
                        options: ['Decision Tree', 'Bubble Sort', 'Quick Sort', 'Binary Search'],
                        correct: 0
                    },
                    {
                        text: 'Qu\'est-ce qu\'un réseau de neurones ?',
                        options: ['Modèle inspiré du cerveau humain', 'Réseau informatique', 'Base de données', 'Système d\'exploitation'],
                        correct: 0
                    },
                    {
                        text: 'Quelle est la fonction d\'activation la plus courante ?',
                        options: ['ReLU', 'Linear', 'Constant', 'Random'],
                        correct: 0
                    },
                    {
                        text: 'Qu\'est-ce que le Deep Learning ?',
                        options: ['Apprentissage avec réseaux profonds', 'Apprentissage rapide', 'Apprentissage simple', 'Apprentissage manuel'],
                        correct: 0
                    }
                ],
                open: [
                    'Expliquez la différence entre IA faible et IA forte.',
                    'Comment fonctionne l\'algorithme de rétropropagation ?',
                    'Quels sont les défis éthiques de l\'IA ?',
                    'Décrivez une application concrète de l\'IA dans votre domaine.'
                ]
            },
            'Sécurité Informatique': {
                mcq: [
                    {
                        text: 'Qu\'est-ce qu\'une attaque par déni de service (DDoS) ?',
                        options: ['Surcharge d\'un serveur', 'Vol de données', 'Modification de fichiers', 'Installation de virus'],
                        correct: 0
                    },
                    {
                        text: 'Quel protocole sécurise les communications web ?',
                        options: ['HTTPS', 'HTTP', 'FTP', 'SMTP'],
                        correct: 0
                    },
                    {
                        text: 'Qu\'est-ce que le phishing ?',
                        options: ['Technique d\'ingénierie sociale', 'Virus informatique', 'Protocole réseau', 'Langage de programmation'],
                        correct: 0
                    },
                    {
                        text: 'Quelle est la longueur recommandée pour un mot de passe sécurisé ?',
                        options: ['Au moins 12 caractères', '6 caractères', '8 caractères', '4 caractères'],
                        correct: 0
                    },
                    {
                        text: 'Qu\'est-ce qu\'un pare-feu (firewall) ?',
                        options: ['Système de filtrage réseau', 'Antivirus', 'Navigateur web', 'Base de données'],
                        correct: 0
                    }
                ],
                open: [
                    'Expliquez les principes de la cryptographie symétrique et asymétrique.',
                    'Quelles sont les mesures de sécurité essentielles pour une entreprise ?',
                    'Comment détecter et prévenir les intrusions réseau ?',
                    'Décrivez les vulnérabilités courantes des applications web.'
                ]
            },
            'Base de Données Avancées': {
                mcq: [
                    {
                        text: 'Qu\'est-ce qu\'une clé primaire ?',
                        options: ['Identifiant unique d\'un enregistrement', 'Mot de passe', 'Nom de la table', 'Type de données'],
                        correct: 0
                    },
                    {
                        text: 'Quelle est la propriété ACID en base de données ?',
                        options: ['Atomicité, Cohérence, Isolation, Durabilité', 'Accès, Contrôle, Index, Données', 'Ajout, Création, Insertion, Destruction', 'Aucune des réponses'],
                        correct: 0
                    },
                    {
                        text: 'Qu\'est-ce qu\'une jointure en SQL ?',
                        options: ['Liaison entre tables', 'Suppression de données', 'Création de table', 'Sauvegarde'],
                        correct: 0
                    },
                    {
                        text: 'Quel type de base de données est MongoDB ?',
                        options: ['NoSQL orientée document', 'Relationnelle', 'Graphe', 'Clé-valeur'],
                        correct: 0
                    },
                    {
                        text: 'Qu\'est-ce que la normalisation en base de données ?',
                        options: ['Élimination de la redondance', 'Ajout de données', 'Suppression de tables', 'Création d\'index'],
                        correct: 0
                    }
                ],
                open: [
                    'Expliquez les différences entre SQL et NoSQL.',
                    'Comment optimiser les performances d\'une requête SQL ?',
                    'Quels sont les avantages et inconvénients de la dénormalisation ?',
                    'Décrivez les stratégies de sauvegarde et de récupération.'
                ]
            },
            'Génie Logiciel': {
                mcq: [
                    {
                        text: 'Qu\'est-ce que la méthode Agile ?',
                        options: ['Développement itératif et collaboratif', 'Développement en cascade', 'Développement rapide', 'Développement automatique'],
                        correct: 0
                    },
                    {
                        text: 'Qu\'est-ce qu\'un test unitaire ?',
                        options: ['Test d\'une fonction isolée', 'Test de l\'interface', 'Test de performance', 'Test de sécurité'],
                        correct: 0
                    },
                    {
                        text: 'Quel est le principe DRY ?',
                        options: ['Don\'t Repeat Yourself', 'Do Repeat Yourself', 'Don\'t Run Yet', 'Do Run Yearly'],
                        correct: 0
                    },
                    {
                        text: 'Qu\'est-ce que l\'intégration continue ?',
                        options: ['Fusion fréquente du code', 'Test manuel', 'Développement isolé', 'Déploiement annuel'],
                        correct: 0
                    },
                    {
                        text: 'Quel pattern de conception sépare l\'interface de l\'implémentation ?',
                        options: ['Bridge', 'Singleton', 'Factory', 'Observer'],
                        correct: 0
                    }
                ],
                open: [
                    'Expliquez les avantages de la programmation orientée objet.',
                    'Comment gérez-vous les versions d\'un logiciel ?',
                    'Quelles sont les étapes du cycle de vie logiciel ?',
                    'Décrivez l\'importance de la documentation technique.'
                ]
            },
            'Réseaux et Télécommunications': {
                mcq: [
                    {
                        text: 'Combien de couches a le modèle OSI ?',
                        options: ['7', '5', '4', '3'],
                        correct: 0
                    },
                    {
                        text: 'Quel protocole est utilisé pour l\'envoi d\'emails ?',
                        options: ['SMTP', 'HTTP', 'FTP', 'SSH'],
                        correct: 0
                    },
                    {
                        text: 'Qu\'est-ce qu\'une adresse IP ?',
                        options: ['Identifiant unique sur un réseau', 'Mot de passe', 'Nom d\'utilisateur', 'Type de câble'],
                        correct: 0
                    },
                    {
                        text: 'Quelle est la différence entre TCP et UDP ?',
                        options: ['TCP est fiable, UDP est rapide', 'TCP est rapide, UDP est fiable', 'Aucune différence', 'TCP est pour le web, UDP pour les emails'],
                        correct: 0
                    },
                    {
                        text: 'Qu\'est-ce qu\'un routeur ?',
                        options: ['Équipement de routage réseau', 'Logiciel antivirus', 'Type de câble', 'Protocole de communication'],
                        correct: 0
                    }
                ],
                open: [
                    'Expliquez le fonctionnement du protocole TCP/IP.',
                    'Quelles sont les différences entre un hub, un switch et un routeur ?',
                    'Comment fonctionne le DNS ?',
                    'Décrivez les avantages et inconvénients des réseaux sans fil.'
                ]
            },
            'Architecture des Systèmes': {
                mcq: [
                    {
                        text: 'Qu\'est-ce qu\'une architecture microservices ?',
                        options: ['Services indépendants et déployables', 'Application monolithique', 'Base de données unique', 'Interface utilisateur'],
                        correct: 0
                    },
                    {
                        text: 'Quel est l\'avantage du load balancing ?',
                        options: ['Répartition de la charge', 'Sécurité renforcée', 'Interface améliorée', 'Stockage optimisé'],
                        correct: 0
                    },
                    {
                        text: 'Qu\'est-ce que la scalabilité horizontale ?',
                        options: ['Ajout de serveurs', 'Amélioration du processeur', 'Augmentation de la RAM', 'Optimisation du code'],
                        correct: 0
                    },
                    {
                        text: 'Quel pattern assure la disponibilité des services ?',
                        options: ['Circuit Breaker', 'Singleton', 'Factory', 'Observer'],
                        correct: 0
                    },
                    {
                        text: 'Qu\'est-ce qu\'un API Gateway ?',
                        options: ['Point d\'entrée unique pour les APIs', 'Base de données', 'Serveur web', 'Protocole réseau'],
                        correct: 0
                    }
                ],
                open: [
                    'Comparez les architectures monolithiques et microservices.',
                    'Expliquez les principes de la haute disponibilité.',
                    'Comment gérer la cohérence des données distribuées ?',
                    'Quels sont les défis de la scalabilité ?'
                ]
            },
            'Machine Learning': {
                mcq: [
                    {
                        text: 'Qu\'est-ce que l\'overfitting ?',
                        options: ['Surajustement aux données d\'entraînement', 'Sous-ajustement', 'Erreur de calcul', 'Manque de données'],
                        correct: 0
                    },
                    {
                        text: 'Quel algorithme est utilisé pour la régression linéaire ?',
                        options: ['Moindres carrés', 'K-means', 'Decision Tree', 'SVM'],
                        correct: 0
                    },
                    {
                        text: 'Qu\'est-ce que la validation croisée ?',
                        options: ['Technique d\'évaluation de modèle', 'Algorithme d\'apprentissage', 'Type de données', 'Méthode de nettoyage'],
                        correct: 0
                    },
                    {
                        text: 'Quel est le rôle de la fonction de coût ?',
                        options: ['Mesurer l\'erreur du modèle', 'Nettoyer les données', 'Créer des features', 'Visualiser les résultats'],
                        correct: 0
                    },
                    {
                        text: 'Qu\'est-ce que le clustering ?',
                        options: ['Regroupement de données similaires', 'Classification supervisée', 'Régression linéaire', 'Réduction de dimension'],
                        correct: 0
                    }
                ],
                open: [
                    'Expliquez la différence entre classification et régression.',
                    'Comment choisir le bon algorithme de machine learning ?',
                    'Quelles sont les étapes du preprocessing des données ?',
                    'Décrivez les métriques d\'évaluation d\'un modèle.'
                ]
            }
        };

        for (let i = 0; i < createdCourses.length; i++) {
            const course = createdCourses[i];
            const subjectQuestions = questionsBySubject[course.name] || questionsBySubject['Développement Mobile'];
            
            // Quiz Mi-Parcours (publié) avec 8-10 questions
            const midTermQuestions = [];
            
            // Ajouter 5-6 questions MCQ
            for (let j = 0; j < Math.min(6, subjectQuestions.mcq.length); j++) {
                const mcqQuestion = subjectQuestions.mcq[j];
                midTermQuestions.push({
                    questionId: new mongoose.Types.ObjectId(),
                    textSnapshot: mcqQuestion.text,
                    qType: 'MCQ',
                    optionsSnapshot: mcqQuestion.options
                });
            }
            
            // Ajouter 2-3 questions ouvertes
            for (let j = 0; j < Math.min(3, subjectQuestions.open.length); j++) {
                midTermQuestions.push({
                    questionId: new mongoose.Types.ObjectId(),
                    textSnapshot: subjectQuestions.open[j],
                    qType: 'OPEN',
                    optionsSnapshot: []
                });
            }

            const midTermQuiz = new Quiz({
                title: `Quiz ${course.name} - Mi-Parcours`,
                courseId: course._id,
                type: 'MI_PARCOURS',
                status: 'PUBLISHED',
                questions: midTermQuestions,
                deadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // Dans 7 jours
            });
            quizzes.push(midTermQuiz);

            // Quiz Final (brouillon) avec 6-8 questions pour certains cours
            if (i < 5) {
                const finalQuestions = [];
                
                // Questions MCQ différentes pour le final
                const startIndex = Math.min(6, subjectQuestions.mcq.length - 4);
                for (let j = startIndex; j < Math.min(startIndex + 4, subjectQuestions.mcq.length); j++) {
                    const mcqQuestion = subjectQuestions.mcq[j] || subjectQuestions.mcq[j % subjectQuestions.mcq.length];
                    finalQuestions.push({
                        questionId: new mongoose.Types.ObjectId(),
                        textSnapshot: `[FINAL] ${mcqQuestion.text}`,
                        qType: 'MCQ',
                        optionsSnapshot: mcqQuestion.options
                    });
                }
                
                // Questions ouvertes pour le final
                const openStartIndex = Math.min(3, subjectQuestions.open.length - 2);
                for (let j = openStartIndex; j < Math.min(openStartIndex + 2, subjectQuestions.open.length); j++) {
                    const openQuestion = subjectQuestions.open[j] || subjectQuestions.open[j % subjectQuestions.open.length];
                    finalQuestions.push({
                        questionId: new mongoose.Types.ObjectId(),
                        textSnapshot: `[EXAMEN FINAL] ${openQuestion}`,
                        qType: 'OPEN',
                        optionsSnapshot: []
                    });
                }

                const finalQuiz = new Quiz({
                    title: `Quiz ${course.name} - Final`,
                    courseId: course._id,
                    type: 'FINAL',
                    status: 'DRAFT',
                    questions: finalQuestions,
                    deadline: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) // Dans 14 jours
                });
                quizzes.push(finalQuiz);
            }

            // Quiz supplémentaire Mi-Parcours (publié) avec questions de révision
            if (i < 3) {
                const reviewQuestions = [];
                
                // Questions de révision (mélange de tout)
                reviewQuestions.push({
                    questionId: new mongoose.Types.ObjectId(),
                    textSnapshot: `Quels sont les concepts clés à retenir en ${course.name} ?`,
                    qType: 'OPEN',
                    optionsSnapshot: []
                });
                
                reviewQuestions.push({
                    questionId: new mongoose.Types.ObjectId(),
                    textSnapshot: `Évaluez votre compréhension globale de ${course.name}`,
                    qType: 'MCQ',
                    optionsSnapshot: ['Excellente', 'Bonne', 'Moyenne', 'À améliorer']
                });
                
                reviewQuestions.push({
                    questionId: new mongoose.Types.ObjectId(),
                    textSnapshot: `Citez un exemple pratique d'application de ${course.name}`,
                    qType: 'OPEN',
                    optionsSnapshot: []
                });

                const reviewQuiz = new Quiz({
                    title: `Quiz ${course.name} - Révision Mi-Parcours`,
                    courseId: course._id,
                    type: 'MI_PARCOURS',
                    status: 'PUBLISHED',
                    questions: reviewQuestions,
                    deadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) // Dans 3 jours
                });
                quizzes.push(reviewQuiz);
            }
        }

        await Quiz.insertMany(quizzes);
        const publishedCount = quizzes.filter(q => q.status === 'PUBLISHED').length;
        const draftCount = quizzes.filter(q => q.status === 'DRAFT').length;
        const totalQuestions = quizzes.reduce((sum, quiz) => sum + quiz.questions.length, 0);
        
        console.log(`  ✅ ${quizzes.length} quiz créés avec ${totalQuestions} questions au total`);
        console.log(`     📊 ${publishedCount} publiés, ${draftCount} brouillons`);
        console.log(`     📝 Moyenne de ${Math.round(totalQuestions / quizzes.length)} questions par quiz`);

        // ========================================
        // 7. RÉSUMÉ FINAL
        // ========================================
        console.log('\n🎉 BASE DE DONNÉES COMPLÈTEMENT RÉINITIALISÉE ET PEUPLÉE !');
        console.log('=====================================');
        console.log(`📅 Années académiques: ${createdYears.length}`);
        console.log(`🏫 Classes: ${createdClasses.length}`);
        console.log(`📚 Cours: ${createdCourses.length}`);
        console.log(`👥 Utilisateurs: ${1 + 1 + 1 + additionalStudents.length} (1 admin + 2 étudiants principaux + ${additionalStudents.length} étudiants)`);
        console.log(`📝 Quiz: ${quizzes.length} avec ${totalQuestions} questions (${publishedCount} publiés, ${draftCount} brouillons)`);
        console.log('=====================================');
        
        console.log('\n📋 COMPTES DE TEST:');
        console.log(`👨‍💼 Admin: admin@institut.fr / password123`);
        console.log(`🧪 Test changement classe: test.student@example.com / password123 (${testClass.code})`);
        console.log(`👨‍🎓 Étudiant principal: igre.urbain@institutsaintjean.org / password123 (${mainClass.code})`);
        console.log(`👥 Autres étudiants: etudiant2@institut.fr à etudiant15@institut.fr / password123`);
        
        console.log('\n🎯 FONCTIONNALITÉS TESTABLES:');
        console.log('✅ Changement de classe (test.student@example.com en ING1-GEN-FR)');
        console.log(`✅ Quiz détaillés (${publishedCount} quiz publiés avec questions réalistes)`);
        console.log('✅ Authentification par carte (matricule: 2223i278)');
        console.log('✅ Administration (admin@institut.fr)');
        
        console.log('\n📊 DÉTAIL DES QUIZ:');
        const quizByType = quizzes.reduce((acc, quiz) => {
            acc[quiz.type] = (acc[quiz.type] || 0) + 1;
            return acc;
        }, {});
        Object.entries(quizByType).forEach(([type, count]) => {
            console.log(`   ${type}: ${count} quiz`);
        });
        
        console.log('\n📚 MATIÈRES AVEC QUESTIONS DÉTAILLÉES:');
        Object.keys(questionsBySubject).forEach(subject => {
            const subjectData = questionsBySubject[subject];
            console.log(`   ${subject}: ${subjectData.mcq.length} MCQ + ${subjectData.open.length} questions ouvertes`);
        });

    } catch (error) {
        console.error('❌ Erreur lors de la réinitialisation:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Déconnecté de MongoDB');
    }
}

// Exécution du script
if (require.main === module) {
    resetAndSeedDatabase();
}

module.exports = { resetAndSeedDatabase };