/**
 * Poshan Darpan API — Express server entry point.
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const { credentialsConfigured } = require('./config/firebase-admin');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const schoolRoutes = require('./routes/schoolRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const alertRoutes = require('./routes/alertRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

const app = express();

// Trust the first proxy hop (nginx/cloud load balancer). Required for
// express-rate-limit to read the real client IP from X-Forwarded-For instead
// of treating every request as coming from the proxy.
app.set('trust proxy', 1);

app.use(helmet());

// CORS — in dev, accept any origin (including file:// which sends "Origin: null").
// In production, FRONTEND_URL pins it to a single allowed origin.
const isDev = (process.env.NODE_ENV || 'development') !== 'production';
app.use(
  cors({
    origin: isDev ? true : (process.env.FRONTEND_URL || false),
    credentials: true
  })
);

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Try again in 15 minutes.',
    error: 'RATE_LIMIT_EXCEEDED'
  }
});

app.use('/api/auth', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/transactions', transactionRoutes);
// app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Poshan Darpan API is running',
    firebaseConfigured: credentialsConfigured,
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    error: 'NOT_FOUND'
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Poshan Darpan API running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
}

module.exports = app;
