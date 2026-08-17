const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../database/init');

const router = express.Router();
const db = getDatabase();

// Get all inventory items
router.get('/items', (req, res) => {
  db.all(`SELECT * FROM inventory_items WHERE status = 'active' ORDER BY name`, [], (err, items) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(items);
  });
});

// Get item by ID
router.get('/items/:id', (req, res) => {
  db.get(`SELECT * FROM inventory_items WHERE id = ?`, [req.params.id], (err, item) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  });
});

// Add inventory item
router.post('/items', (req, res) => {
  const { name, category, quantity, price, supplier } = req.body;
  const itemId = uuidv4();

  db.run(
    `INSERT INTO inventory_items (id, name, category, quantity, price, supplier, lastRestocked) 
     VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [itemId, name, category, quantity, price, supplier],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: 'Item added', itemId });
    }
  );
});

// Update inventory item
router.put('/items/:id', (req, res) => {
  const { name, category, quantity, price, supplier, status } = req.body;

  db.run(
    `UPDATE inventory_items SET name = ?, category = ?, quantity = ?, price = ?, supplier = ?, status = ? WHERE id = ?`,
    [name, category, quantity, price, supplier, status, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Item updated' });
    }
  );
});

// Record inventory transaction
router.post('/transactions', (req, res) => {
  const { itemId, type, quantity, reason } = req.body;
  const transactionId = uuidv4();

  db.run(
    `INSERT INTO inventory_transactions (id, itemId, type, quantity, reason, createdBy) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [transactionId, itemId, type, quantity, reason, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      
      // Update inventory quantity
      const quantityChange = type === 'in' ? quantity : -quantity;
      db.run(
        `UPDATE inventory_items SET quantity = quantity + ? WHERE id = ?`,
        [quantityChange, itemId],
        (err) => {
          if (err) return res.status(500).json({ error: err.message });
          res.status(201).json({ message: 'Transaction recorded', transactionId });
        }
      );
    }
  );
});

module.exports = router;
