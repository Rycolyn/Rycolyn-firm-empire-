const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../database/init');

const router = express.Router();
const db = getDatabase();

// Get all caregiving clients
router.get('/clients', (req, res) => {
  db.all(`SELECT * FROM caregiving_clients ORDER BY createdAt DESC`, [], (err, clients) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(clients);
  });
});

// Get client by ID
router.get('/clients/:id', (req, res) => {
  db.get(`SELECT * FROM caregiving_clients WHERE id = ?`, [req.params.id], (err, client) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json(client);
  });
});

// Create caregiving client
router.post('/clients', (req, res) => {
  const { name, email, phone, serviceType, caregiverAssigned, schedule } = req.body;
  const clientId = uuidv4();

  db.run(
    `INSERT INTO caregiving_clients (id, name, email, phone, serviceType, caregiverAssigned, schedule) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [clientId, name, email, phone, serviceType, caregiverAssigned, schedule],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: 'Caregiving client added', clientId });
    }
  );
});

// Update client
router.put('/clients/:id', (req, res) => {
  const { name, email, phone, serviceType, caregiverAssigned, schedule, status } = req.body;

  db.run(
    `UPDATE caregiving_clients SET name = ?, email = ?, phone = ?, serviceType = ?, caregiverAssigned = ?, schedule = ?, status = ? WHERE id = ?`,
    [name, email, phone, serviceType, caregiverAssigned, schedule, status, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Client updated' });
    }
  );
});

module.exports = router;
