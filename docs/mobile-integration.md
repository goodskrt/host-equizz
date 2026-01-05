# Intégration Frontend Mobile - Backend

## 🎯 Vue d'ensemble

Cette documentation explique comment connecter l'application mobile React Native au backend Node.js/Express pour l'authentification et la gestion du profil.

## 🔧 Configuration Backend

### 1. Nouvelles Routes Ajoutées

```javascript
// Authentification classique
POST /api/auth/login
POST /api/auth/register

// Authentification par carte (NOUVEAU)
POST /api/auth/card-login

// Profil utilisateur (NOUVEAU)
GET /api/auth/profile

// Changement de mot de passe (NOUVEAU)
POST /api/auth/change-password
```

### 2. Contrôleur d'Authentification Étendu

**Fichier** : `controllers/authController.js`

#### Authentification par Carte
```javascript
exports.cardLogin = async (req, res) => {
  const { matricule, name, classId, role } = req.body;
  
  // 1. Chercher l'utilisateur par matricule
  // 2. Vérifier que le nom correspond exactement
  // 3. Retourner token + données utilisateur si valide
}
```

**Logique** :
- Recherche par matricule dans la base de données
- Vérification exacte du nom (firstName + lastName)
- Authentification sans mot de passe
- Génération du token JWT

#### Profil Utilisateur
```javascript
exports.getProfile = async (req, res) => {
  // Récupération du profil avec middleware d'authentification
}
```

#### Changement de Mot de Passe
```javascript
exports.changePassword = async (req, res) => {
  // Vérification mot de passe actuel + mise à jour
}
```

### 3. Format des Réponses API

**Succès** :
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@email.com",
      "name": "Prénom Nom",
      "role": "student",
      "matricule": "2223i278",
      "classId": "class_id",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

**Erreur** :
```json
{
  "success": false,
  "error": "Message d'erreur"
}
```

## 📱 Configuration Frontend

### 1. URL de l'API

**Fichier** : `Front-end/EQuizz_Mobile/.env`
```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
```

**Fichier** : `Front-end/EQuizz_Mobile/constants/App.ts`
```typescript
baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api'
```

### 2. Endpoints Mis à Jour

```typescript
auth: {
  login: '/auth/login',
  register: '/auth/register',
  cardAuth: '/auth/card-login',      // NOUVEAU
  profile: '/auth/profile',          // NOUVEAU
  changePassword: '/auth/change-password' // NOUVEAU
}
```

## 🚀 Démarrage et Test

### 1. Préparer la Base de Données

```bash
# Dans le dossier Back-end
cd Back-end

# Créer l'utilisateur de test
npm run seed:test-user
```

**Utilisateur créé** :
- Matricule: `2223i278`
- Nom: `IGRE URBAIN LEPONTIFE`
- Email: `igre.urbain@institutsaintjean.org`
- Mot de passe: `password123`

### 2. Démarrer le Backend

```bash
# Dans le dossier Back-end
npm run dev
```

**Serveur disponible sur** : `http://localhost:5000`

### 3. Démarrer le Frontend Mobile

```bash
# Dans le dossier Front-end/EQuizz_Mobile
npm start
# ou
npx expo start
```

## 🧪 Tests d'Intégration

### 1. Test d'Authentification par Carte

**Données de test** :
```json
{
  "matricule": "2223i278",
  "name": "IGRE URBAIN LEPONTIFE",
  "classId": "ING3-ISI",
  "role": "STUDENT"
}
```

**Flux de test** :
1. Ouvrir l'app mobile
2. Aller à "Scanner ma carte étudiant"
3. Appuyer sur le bouton de capture
4. Vérifier l'authentification réussie
5. Redirection vers la page d'accueil

### 2. Test d'Authentification Classique

**Données de test** :
- Email/Matricule: `igre.urbain@institutsaintjean.org` ou `2223i278`
- Mot de passe: `password123`

### 3. Test du Profil

1. Se connecter avec l'une des méthodes
2. Aller dans l'onglet Profil
3. Vérifier l'affichage des informations
4. Tester le changement de mot de passe

## 🔍 Débogage

### Logs Backend
```javascript
console.log('🎓 Tentative d\'authentification par carte:', { matricule, name });
console.log('✅ Utilisateur trouvé et vérifié:', user.email);
console.log('❌ Informations ne correspondent pas');
```

### Logs Frontend
```typescript
console.log('🎓 Authentification par carte:', cardData);
console.log('✅ Utilisateur connecté via carte:', user.name);
```

### Erreurs Communes

1. **CORS Error** : Vérifier que le backend accepte les requêtes du frontend
2. **Network Error** : Vérifier que l'URL de l'API est correcte
3. **401 Unauthorized** : Vérifier le token JWT
4. **404 Not Found** : Vérifier les routes et endpoints

## 📊 Endpoints Détaillés

### POST /api/auth/card-login

**Request** :
```json
{
  "matricule": "2223i278",
  "name": "IGRE URBAIN LEPONTIFE",
  "classId": "ING3-ISI",
  "role": "STUDENT"
}
```

**Response Success** :
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "jwt_token"
  }
}
```

**Response Error** :
```json
{
  "success": false,
  "error": "Aucun compte trouvé pour ce matricule"
}
```

### GET /api/auth/profile

**Headers** :
```
Authorization: Bearer jwt_token_here
```

**Response** :
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@email.com",
    "name": "Prénom Nom",
    "role": "student",
    "matricule": "2223i278",
    "classId": "class_id"
  }
}
```

### POST /api/auth/change-password

**Headers** :
```
Authorization: Bearer jwt_token_here
```

**Request** :
```json
{
  "currentPassword": "old_password",
  "newPassword": "new_password"
}
```

**Response** :
```json
{
  "success": true,
  "message": "Mot de passe modifié avec succès"
}
```

## 🔐 Sécurité

### Authentification par Carte
- ✅ Vérification exacte du matricule
- ✅ Vérification exacte du nom complet
- ✅ Pas de création automatique d'utilisateur
- ✅ Utilisateur doit exister en base de données

### JWT Tokens
- ✅ Expiration : 30 jours
- ✅ Secret sécurisé dans .env
- ✅ Middleware de protection des routes

### Mots de Passe
- ✅ Hashage avec bcrypt
- ✅ Validation de l'ancien mot de passe
- ✅ Vérification de la différence nouveau/ancien

L'intégration est maintenant complète et prête pour les tests !