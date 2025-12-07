const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Report an issue
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { booking_id, property_id, issue_type, title, description, images } = req.body;
    const guest_id = req.user.id;

    if (!booking_id || !property_id || !issue_type || !title || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [result] = await pool.execute(
      `INSERT INTO issues (booking_id, property_id, guest_id, issue_type, title, description, images)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        booking_id,
        property_id,
        guest_id,
        issue_type,
        title,
        description,
        images ? JSON.stringify(images) : null
      ]
    );

    const [newIssue] = await pool.execute(
      'SELECT * FROM issues WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newIssue[0]);
  } catch (error) {
    console.error('Report issue error:', error);
    res.status(500).json({ error: 'Server error reporting issue' });
  }
});

// Get issues for current user
router.get('/my-issues', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [issues] = await pool.execute(
      `SELECT i.*, p.name as property_name
       FROM issues i
       LEFT JOIN properties p ON i.property_id = p.id
       WHERE i.guest_id = ?
       ORDER BY i.created_at DESC`,
      [userId]
    );

    res.json(issues);
  } catch (error) {
    console.error('Get issues error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


