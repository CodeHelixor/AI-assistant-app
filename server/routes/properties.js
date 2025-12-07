const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get property by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [properties] = await pool.execute(
      'SELECT * FROM properties WHERE id = ?',
      [id]
    );

    if (properties.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const property = properties[0];

    // Get equipment instructions
    const [equipment] = await pool.execute(
      'SELECT * FROM equipment_instructions WHERE property_id = ?',
      [id]
    );

    // Get house rules
    const [rules] = await pool.execute(
      'SELECT * FROM house_rules WHERE property_id = ?',
      [id]
    );

    // Get stargazing info
    const [stargazing] = await pool.execute(
      'SELECT * FROM stargazing_info WHERE property_id = ?',
      [id]
    );

    res.json({
      ...property,
      equipment_instructions: equipment,
      house_rules: rules,
      stargazing_info: stargazing[0] || null
    });
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get active booking for guest
router.get('/:id/active-booking', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const guestId = req.user.id;

    const [bookings] = await pool.execute(
      `SELECT * FROM bookings 
       WHERE property_id = ? AND guest_id = ? 
       AND status = 'active' 
       AND check_in_date <= CURDATE() 
       AND check_out_date >= CURDATE()
       ORDER BY check_in_date DESC LIMIT 1`,
      [id, guestId]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'No active booking found' });
    }

    res.json(bookings[0]);
  } catch (error) {
    console.error('Get active booking error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


