const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const apiRoutes = require('./routes/apiRoutes');

// --- SWAGGER ---
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

dotenv.config();

// 🔴 IMPORTANT : on ne connecte PAS la DB en test
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger
try {
  const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log('Documentation Swagger chargée sur /api-docs');
} catch (err) {
  console.error('Erreur chargement Swagger:', err.message);
}

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.send('API EQuizz v1.0 running...');
});

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'EQuizz Backend API'
  });
});

// Middleware d'erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Erreur serveur interne');
});

const PORT = process.env.PORT || 5000;

// Ne lancer le serveur que hors tests
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur démarré sur le port ${PORT} (toutes interfaces)`);
  });
}

module.exports = app;
