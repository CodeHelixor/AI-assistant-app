const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Submit feedback
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { booking_id, property_id, rating, comments } = req.body;
    const guest_id = req.user.id;

    if (!booking_id || !property_id || !rating) {
      return res.status(400).json({ error: 'Booking ID, property ID, and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const [result] = await pool.execute(
      `INSERT INTO guest_feedback (booking_id, property_id, guest_id, rating, comments)
       VALUES (?, ?, ?, ?, ?)`,
      [booking_id, property_id, guest_id, rating, comments || null]
    );

    const [newFeedback] = await pool.execute(
      'SELECT * FROM guest_feedback WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newFeedback[0]);
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ error: 'Server error submitting feedback' });
  }
});

// Get feedback for a property (for hosts/admins)
router.get('/property/:propertyId', authenticateToken, async (req, res) => {
  try {
    const { propertyId } = req.params;

    const [feedback] = await pool.execute(
      `SELECT gf.*, u.first_name, u.last_name
       FROM guest_feedback gf
       JOIN users u ON gf.guest_id = u.id
       WHERE gf.property_id = ?
       ORDER BY gf.created_at DESC`,
      [propertyId]
    );

    res.json(feedback);
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


