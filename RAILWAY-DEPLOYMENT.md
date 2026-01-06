# EQuizz Backend - Déploiement Railway

## Configuration pour Railway

Ce backend est prêt pour le déploiement sur Railway avec les configurations suivantes :

### Fichiers de configuration

- `railway.json` : Configuration de build et déploiement Railway
- `package.json` : Script "start" configuré pour `node server.js`
- Endpoint `/health` : Health check pour Railway

## Variables d'environnement COMPLÈTES pour Railway

Configurez TOUTES ces variables dans Railway Dashboard :

### 🔧 Configuration de base
```
NODE_ENV=production
PORT=5000
```

### 🗄️ Base de données MongoDB
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority
```

### 🔐 Authentification JWT
```
JWT_SECRET=your_super_secure_jwt_secret_key_here_minimum_32_characters
```

### 📧 Configuration SMTP (Email)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here
SMTP_FROM_NAME=EQuizz - Institut Saint Jean
SMTP_FROM_EMAIL=your_email@gmail.com
```

### 🔥 Firebase (Notifications Push)
```
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

## Configuration JSON Firebase pour Railway

Créez une variable d'environnement `FIREBASE_SERVICE_ACCOUNT` avec le contenu JSON complet :

```json
{
  "type": "service_account",
  "project_id": "your_firebase_project_id",
  "private_key_id": "your_private_key_id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",
  "client_id": "your_client_id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project.iam.gserviceaccount.com"
}
```

## Déploiement étape par étape

1. **Connecter le repo à Railway**
   - Allez sur railway.app
   - Créez un nouveau projet
   - Connectez le repo GitHub `goodskrt/host-equizz`

2. **Configurer les variables d'environnement**
   - Dans Railway Dashboard → Variables
   - Ajoutez TOUTES les variables listées ci-dessus
   - Voir le fichier `RAILWAY-ENV-VALUES.md` pour les valeurs exactes

3. **Déploiement automatique**
   - Railway détectera le `nixpacks.toml` (Node.js 20)
   - Railway utilisera le `railway.json` pour la configuration
   - Le build se lancera automatiquement
   - L'application sera accessible via l'URL fournie

## ✅ Corrections Appliquées

- **Node.js 20** : Fichier `nixpacks.toml` ajouté pour compatibilité
- **Build simplifié** : `railway.json` modifié (plus de `npm run build`)
- **Health check** : Endpoint `/health` ajouté au serveur
- **Sécurité** : Fichiers sensibles exclus du repo

## Endpoints disponibles

- `GET /` : Status de l'API
- `GET /health` : Health check pour Railway
- `GET /api-docs` : Documentation Swagger
- `POST /api/auth/test-login` : Test d'authentification
- Toutes les routes API sous `/api/*`

## Notes importantes de sécurité

⚠️ **IMPORTANT** : 
- Le fichier `serviceAccountKey.json` est exclu du repo pour la sécurité
- Utilisez des mots de passe d'application Gmail (pas votre mot de passe principal)
- Générez un JWT_SECRET fort (minimum 32 caractères)
- Utilisez une base de données MongoDB Atlas en production

## Test de déploiement

Une fois déployé, testez ces endpoints :
- `GET https://your-app.railway.app/health` → Doit retourner status OK
- `GET https://your-app.railway.app/api-docs` → Documentation Swagger
- `POST https://your-app.railway.app/api/auth/test-login` → Test d'auth