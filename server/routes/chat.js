const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get chat messages for a booking
router.get('/booking/:bookingId', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    // Verify user has access to this booking
    const [bookings] = await pool.execute(
      'SELECT * FROM bookings WHERE id = ? AND (guest_id = ? OR property_id IN (SELECT id FROM properties WHERE host_id = ?))',
      [bookingId, userId, userId]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found or access denied' });
    }

    const [messages] = await pool.execute(
      `SELECT cm.*, u.first_name, u.last_name, u.role
       FROM chat_messages cm
       JOIN users u ON cm.sender_id = u.id
       WHERE cm.booking_id = ?
       ORDER BY cm.created_at ASC`,
      [bookingId]
    );

    // Mark messages as read
    await pool.execute(
      'UPDATE chat_messages SET is_read = TRUE WHERE booking_id = ? AND receiver_id = ?',
      [bookingId, userId]
    );

    res.json(messages);
  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send message
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { booking_id, receiver_id, message } = req.body;
    const sender_id = req.user.id;

    if (!booking_id || !receiver_id || !message) {
      return res.status(400).json({ error: 'Booking ID, receiver ID, and message are required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO chat_messages (booking_id, sender_id, receiver_id, message) VALUES (?, ?, ?, ?)',
      [booking_id, sender_id, receiver_id, message]
    );

    const [newMessage] = await pool.execute(
      `SELECT cm.*, u.first_name, u.last_name, u.role
       FROM chat_messages cm
       JOIN users u ON cm.sender_id = u.id
       WHERE cm.id = ?`,
      [result.insertId]
    );

    res.status(201).json(newMessage[0]);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Server error sending message' });
  }
});

module.exports = router;


