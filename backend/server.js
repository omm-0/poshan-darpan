const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { connectDB } = require('./config/db');

// Import Routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const attendanceRoutes = require('./routes/attendance');
const inventoryRoutes = require('./routes/inventory');
const reportRoutes = require('./routes/reports');
const schoolRoutes = require('./routes/schools');

const app = express();

// Initialize Firebase
connectDB();

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve uploaded files (report PDFs etc)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve the frontend (index.html from parent directory)
app.use(express.static(path.join(__dirname, '..')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/schools', schoolRoutes);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend for any non-API route (SPA fallback)
app.get('{*path}', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '..', 'index.html'));
    }
});

// Error Handler Middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err.stack);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`\n🚀 Poshan Darpan Backend running on http://localhost:${PORT}`);
    console.log(`📂 Frontend served at http://localhost:${PORT}/index.html`);
    console.log(`📡 API available at http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
