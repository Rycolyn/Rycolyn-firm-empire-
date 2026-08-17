const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const clinicRoutes = require('./routes/clinic');
const caregivingRoutes = require('./routes/caregiving');
const educationRoutes = require('./routes/education');
const inventoryRoutes = require('./routes/inventory');
const userRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');

const { initializeDatabase } = require('./database/init');
const { authMiddleware } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Initialize database
initializeDatabase();

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/clinic', authMiddleware, clinicRoutes);
app.use('/api/caregiving', authMiddleware, caregivingRoutes);
app.use('/api/education', authMiddleware, educationRoutes);
app.use('/api/inventory', authMiddleware, inventoryRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);

// Serve static HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/staff-login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'staff-login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/goals', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'goals.html'));
});

app.get('/social-media', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'social-media.html'));
});

app.get('/user', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'user.html'));
});

app.get('/library', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'library.html'));
});

app.get('/library-admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'library-admin.html'));
});

app.get('/clinic', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'clinic.html'));
});

app.get('/caregiving', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'caregiving.html'));
});

app.get('/education', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'education.html'));
});

app.get('/inventory', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'inventory.html'));
});

app.get('/theresa-hope', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'theresa-hope.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Rycolyn Server Running', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Rycolyn Digital Headquarters running on http://localhost:${PORT}`);
  console.log(`📊 We serve, we grow, there is hope.`);
});

module.exports = app;
