/**
 * Script pour lister tous les utilisateurs en base de données
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const { Class, AcademicYear } = require('../models/Academic');
require('dotenv').config();

const listAllUsers = async () => {
  try {
    // Connexion à la base de données
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connexion à MongoDB réussie');

    // Récupérer tous les utilisateurs avec leurs classes
    const users = await User.find({})
      .populate({
        path: 'classId',
        populate: {
          path: 'academicYear',
          model: 'AcademicYear'
        }
      })
      .sort({ createdAt: -1 });

    console.log(`\n📊 LISTE DE TOUS LES UTILISATEURS (${users.length} utilisateurs trouvés)\n`);
    console.log('=' .repeat(120));

    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé en base de données');
      return;
    }

    // Afficher les utilisateurs
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. 👤 ${user.firstName} ${user.lastName}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🎓 Matricule: ${user.matricule || 'Non défini'}`);
      console.log(`   👑 Rôle: ${user.role}`);
      
      if (user.classId) {
        console.log(`   🏫 Classe: ${user.classId.code}`);
        console.log(`   📚 Spécialité: ${user.classId.speciality}`);
        console.log(`   📊 Niveau: ${user.classId.level}`);
        console.log(`   🌍 Langue: ${user.classId.language}`);
        if (user.classId.academicYear) {
          console.log(`   📅 Année académique: ${user.classId.academicYear.label}`);
        }
      } else {
        console.log(`   🏫 Classe: Non assignée`);
      }
      
      console.log(`   📱 Token FCM: ${user.fcmToken ? 'Configuré' : 'Non configuré'}`);
      console.log(`   📅 Créé le: ${user.createdAt.toLocaleDateString('fr-FR')} à ${user.createdAt.toLocaleTimeString('fr-FR')}`);
      console.log(`   🔄 Modifié le: ${user.updatedAt.toLocaleDateString('fr-FR')} à ${user.updatedAt.toLocaleTimeString('fr-FR')}`);
      console.log('   ' + '-'.repeat(80));
    });

    // Statistiques
    console.log('\n📈 STATISTIQUES');
    console.log('=' .repeat(50));
    
    const stats = {
      total: users.length,
      students: users.filter(u => u.role === 'STUDENT').length,
      admins: users.filter(u => u.role === 'ADMIN').length,
      withClass: users.filter(u => u.classId).length,
      withoutClass: users.filter(u => !u.classId).length,
      withFCM: users.filter(u => u.fcmToken).length,
      withMatricule: users.filter(u => u.matricule).length
    };

    console.log(`👥 Total utilisateurs: ${stats.total}`);
    console.log(`🎓 Étudiants: ${stats.students}`);
    console.log(`👑 Administrateurs: ${stats.admins}`);
    console.log(`🏫 Avec classe assignée: ${stats.withClass}`);
    console.log(`❌ Sans classe: ${stats.withoutClass}`);
    console.log(`📱 Avec token FCM: ${stats.withFCM}`);
    console.log(`🎫 Avec matricule: ${stats.withMatricule}`);

    // Répartition par classe
    const classCounts = {};
    users.forEach(user => {
      if (user.classId) {
        const className = user.classId.code;
        classCounts[className] = (classCounts[className] || 0) + 1;
      }
    });

    if (Object.keys(classCounts).length > 0) {
      console.log('\n🏫 RÉPARTITION PAR CLASSE');
      console.log('=' .repeat(30));
      Object.entries(classCounts)
        .sort(([,a], [,b]) => b - a)
        .forEach(([className, count]) => {
          console.log(`   ${className}: ${count} utilisateur(s)`);
        });
    }

    // Utilisateurs récents (derniers 7 jours)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUsers = users.filter(u => u.createdAt > sevenDaysAgo);

    if (recentUsers.length > 0) {
      console.log('\n🆕 UTILISATEURS RÉCENTS (7 derniers jours)');
      console.log('=' .repeat(40));
      recentUsers.forEach(user => {
        console.log(`   ${user.firstName} ${user.lastName} (${user.email}) - ${user.createdAt.toLocaleDateString('fr-FR')}`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des utilisateurs:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnexion de MongoDB');
  }
};

// Exécuter le script
listAllUsers();