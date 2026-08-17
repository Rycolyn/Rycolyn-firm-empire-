const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../database/init');

const router = express.Router();
const db = getDatabase();

// Get all students
router.get('/students', (req, res) => {
  db.all(`SELECT * FROM students ORDER BY enrollmentDate DESC`, [], (err, students) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(students);
  });
});

// Get student by ID
router.get('/students/:id', (req, res) => {
  db.get(`SELECT * FROM students WHERE id = ?`, [req.params.id], (err, student) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  });
});

// Enroll student
router.post('/students', (req, res) => {
  const { name, email, phone, course } = req.body;
  const studentId = uuidv4();

  db.run(
    `INSERT INTO students (id, name, email, phone, course, enrollmentDate) 
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [studentId, name, email, phone, course],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: 'Student enrolled', studentId });
    }
  );
});

// Update student progress
router.put('/students/:id', (req, res) => {
  const { name, email, phone, course, progress, status } = req.body;

  db.run(
    `UPDATE students SET name = ?, email = ?, phone = ?, course = ?, progress = ?, status = ? WHERE id = ?`,
    [name, email, phone, course, progress, status, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Student updated' });
    }
  );
});

module.exports = router;
