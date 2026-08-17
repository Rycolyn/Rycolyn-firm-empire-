const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../database/init');

const router = express.Router();
const db = getDatabase();

// Get all patients
router.get('/patients', (req, res) => {
  db.all(`SELECT * FROM patients ORDER BY createdAt DESC`, [], (err, patients) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(patients);
  });
});

// Get patient by ID
router.get('/patients/:id', (req, res) => {
  db.get(`SELECT * FROM patients WHERE id = ?`, [req.params.id], (err, patient) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  });
});

// Create patient
router.post('/patients', (req, res) => {
  const { name, email, phone, dateOfBirth, address, medicalHistory } = req.body;
  const patientId = uuidv4();

  db.run(
    `INSERT INTO patients (id, name, email, phone, dateOfBirth, address, medicalHistory, createdBy) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [patientId, name, email, phone, dateOfBirth, address, medicalHistory, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({
        message: 'Patient created',
        patientId,
        patient: { id: patientId, name, email, phone, dateOfBirth, address, medicalHistory }
      });
    }
  );
});

// Update patient
router.put('/patients/:id', (req, res) => {
  const { name, email, phone, dateOfBirth, address, medicalHistory, status } = req.body;

  db.run(
    `UPDATE patients SET name = ?, email = ?, phone = ?, dateOfBirth = ?, address = ?, medicalHistory = ?, status = ? WHERE id = ?`,
    [name, email, phone, dateOfBirth, address, medicalHistory, status, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Patient updated' });
    }
  );
});

// Delete patient
router.delete('/patients/:id', (req, res) => {
  db.run(`UPDATE patients SET status = 'inactive' WHERE id = ?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Patient deactivated' });
  });
});

// Get appointments
router.get('/appointments', (req, res) => {
  db.all(
    `SELECT a.*, p.name as patientName FROM appointments a 
     JOIN patients p ON a.patientId = p.id 
     ORDER BY a.appointmentDate DESC`,
    [],
    (err, appointments) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(appointments);
    }
  );
});

// Schedule appointment
router.post('/appointments', (req, res) => {
  const { patientId, doctorName, appointmentDate, type, notes } = req.body;
  const appointmentId = uuidv4();

  db.run(
    `INSERT INTO appointments (id, patientId, doctorName, appointmentDate, type, notes) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [appointmentId, patientId, doctorName, appointmentDate, type, notes],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: 'Appointment scheduled', appointmentId });
    }
  );
});

module.exports = router;
