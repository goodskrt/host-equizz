# Variables d'environnement EXACTES pour Railway

## 🔧 Configuration de base
```
NODE_ENV=production
PORT=5000
```

## 🗄️ Base de données MongoDB
```
MONGO_URI=mongodb+srv://iulp562_db_user:Igreurbain562@cluster0.imuet5k.mongodb.net/?appName=Cluster0
```

## 🔐 Authentification JWT
```
JWT_SECRET=equizz_jwt_secret_key_2024_development
```

## 📧 Configuration SMTP (Email)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=iulp562@gmail.com
SMTP_PASS=tnlf dzxa rqvt tryx
SMTP_FROM_NAME=EQuizz - Institut Saint Jean
SMTP_FROM_EMAIL=iulp562@gmail.com
```

## 🔥 Firebase (Notifications Push)
```
FIREBASE_PROJECT_ID=equizz-5
FIREBASE_PRIVATE_KEY_ID=3d5feae26c6c9f75ce13f44015d2355d7aa16a51
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@equizz-5.iam.gserviceaccount.com
```

## ⚠️ IMPORTANT - Configuration Firebase

Pour Railway, vous devrez créer une variable d'environnement `FIREBASE_SERVICE_ACCOUNT` avec le JSON complet du service account.

Le fichier `serviceAccountKey.json` original contient toutes les clés nécessaires mais a été exclu du repo pour la sécurité.

### Option 1: Récupérer depuis Firebase Console
1. Allez sur Firebase Console → Project Settings → Service Accounts
2. Générez une nouvelle clé privée
3. Copiez le contenu JSON complet dans la variable `FIREBASE_SERVICE_ACCOUNT`

### Option 2: Utiliser les variables individuelles
Alternativement, vous pouvez ajouter chaque champ Firebase séparément :
- `FIREBASE_TYPE=service_account`
- `FIREBASE_PROJECT_ID=equizz-5`
- `FIREBASE_PRIVATE_KEY_ID=3d5feae26c6c9f75ce13f44015d2355d7aa16a51`
- `FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@equizz-5.iam.gserviceaccount.com`
- `FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n[VOTRE_CLE_PRIVEE]\n-----END PRIVATE KEY-----\n`

## 🚀 Commandes de déploiement Railway

1. **Via Railway CLI:**
```bash
railway login
railway link
railway up
```

2. **Via GitHub Integration:**
- Connectez le repo sur railway.app
- Les variables seront configurées via l'interface web

## 🧪 Test après déploiement

Testez ces endpoints une fois déployé :
```bash
curl https://votre-app.railway.app/health
curl https://votre-app.railway.app/api-docs
```