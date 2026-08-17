const express = require('express');
const { getDatabase } = require('../database/init');
const { adminMiddleware } = require('../middleware/auth');

const router = express.Router();
const db = getDatabase();

// Get current user profile
router.get('/profile', (req, res) => {
  db.get(`SELECT id, username, email, fullName, department, role, createdAt FROM users WHERE id = ?`, [req.user.id], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  });
});

// Update user profile
router.put('/profile', (req, res) => {
  const { fullName, department } = req.body;
  
  db.run(
    `UPDATE users SET fullName = ?, department = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
    [fullName, department, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Profile updated successfully' });
    }
  );
});

// Create a staff account (admin only)
router.post('/staff', adminMiddleware, (req, res) => {
  const { username, email, password, fullName, department } = req.body;

  if (!username || !email || !password || !fullName) {
    return res.status(400).json({ error: 'Missing required staff fields' });
  }

  const hashedPassword = require('bcryptjs').hashSync(password, 10);
  const userId = require('uuid').v4();

  db.run(
    `INSERT INTO users (id, username, email, password, fullName, department, role)
     VALUES (?, ?, ?, ?, ?, ?, 'staff')`,
    [userId, username, email, hashedPassword, fullName, department || 'Operations'],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Username or email already exists' });
        }
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({
        message: 'Staff account created successfully',
        staff: { id: userId, username, email, fullName, department: department || 'Operations', role: 'staff' }
      });
    }
  );
});

// Get all users (admin only)
router.get('/', adminMiddleware, (req, res) => {
  db.all(
    `SELECT id, username, email, fullName, department, role, createdAt FROM users ORDER BY role, username`,
    [],
    (err, users) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(users);
    }
  );
});

// Create a client account (public self-registration)
router.post('/client', (req, res) => {
  const { username, email, password, fullName } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields: username, email, password' });
  }

  const hashedPassword = require('bcryptjs').hashSync(password, 10);
  const userId = require('uuid').v4();

  db.run(
    `INSERT INTO users (id, username, email, password, fullName, department, role)
     VALUES (?, ?, ?, ?, ?, ?, 'user')`,
    [userId, username, email, hashedPassword, fullName || 'Client', 'Client', 'user'],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Username or email already exists' });
        }
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({
        message: 'Client account created successfully. You can now login.',
        user: { id: userId, username, email, fullName: fullName || 'Client', role: 'user' }
      });
    }
  );
});

// Update user role (admin only)
router.put('/:userId/role', adminMiddleware, (req, res) => {
  const { role } = req.body;
  
  db.run(
    `UPDATE users SET role = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
    [role, req.params.userId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'User role updated' });
    }
  );
});

module.exports = router;
