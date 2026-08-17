const express = require('express');
const { getDatabase } = require('../database/init');

const router = express.Router();
const db = getDatabase();

// Get dashboard statistics
router.get('/stats', (req, res) => {
  const stats = {};

  // Get total patients
  db.get(`SELECT COUNT(*) as count FROM patients WHERE status = 'active'`, [], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    stats.totalPatients = result.count;

    // Get total caregiving clients
    db.get(`SELECT COUNT(*) as count FROM caregiving_clients WHERE status = 'active'`, [], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      stats.totalCaregiversClients = result.count;

      // Get total students
      db.get(`SELECT COUNT(*) as count FROM students WHERE status = 'active'`, [], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        stats.totalStudents = result.count;

        // Get total inventory items
        db.get(`SELECT COUNT(*) as count FROM inventory_items WHERE status = 'active'`, [], (err, result) => {
          if (err) return res.status(500).json({ error: err.message });
          stats.totalInventoryItems = result.count;

          // Get low stock items
          db.all(`SELECT id, name, quantity FROM inventory_items WHERE quantity < 10 AND status = 'active'`, [], (err, items) => {
            if (err) return res.status(500).json({ error: err.message });
            stats.lowStockItems = items;

            // Get upcoming appointments
            db.all(
              `SELECT a.*, p.name as patientName FROM appointments a 
               JOIN patients p ON a.patientId = p.id 
               WHERE a.appointmentDate >= datetime('now') AND a.status = 'scheduled'
               ORDER BY a.appointmentDate LIMIT 5`,
              [],
              (err, appointments) => {
                if (err) return res.status(500).json({ error: err.message });
                stats.upcomingAppointments = appointments;

                res.json(stats);
              }
            );
          });
        });
      });
    });
  });
});

router.get('/finance-summary', (req, res) => {
  const summary = {
    mainAccountBalance: 0,
    totalReceived: 0,
    totalPending: 0,
    totalByMethod: [],
    recentTransactions: []
  };

  db.get(
    `SELECT COALESCE(SUM(CASE WHEN status = 'received' THEN amount ELSE 0 END), 0) as totalReceived,
            COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as totalPending,
            COALESCE(SUM(amount), 0) as totalBalance
     FROM payment_records`,
    [],
    (err, totals) => {
      if (err) return res.status(500).json({ error: err.message });

      summary.totalReceived = Number(totals.totalReceived || 0);
      summary.totalPending = Number(totals.totalPending || 0);
      summary.mainAccountBalance = Number(totals.totalBalance || 0);

      db.all(
        `SELECT paymentMethod, methodLabel, SUM(amount) as total, COUNT(*) as count
         FROM payment_records
         WHERE status = 'received'
         GROUP BY paymentMethod, methodLabel
         ORDER BY total DESC`,
        [],
        (err, byMethod) => {
          if (err) return res.status(500).json({ error: err.message });
          summary.totalByMethod = byMethod.map((item) => ({
            ...item,
            total: Number(item.total || 0)
          }));

          db.all(
            `SELECT id, paymentMethod, methodLabel, amount, currency, status, reference, sender, receivedAt
             FROM payment_records
             ORDER BY receivedAt DESC
             LIMIT 10`,
            [],
            (err, transactions) => {
              if (err) return res.status(500).json({ error: err.message });
              summary.recentTransactions = transactions.map((item) => ({
                ...item,
                amount: Number(item.amount || 0)
              }));
              res.json(summary);
            }
          );
        }
      );
    }
  );
});

module.exports = router;
