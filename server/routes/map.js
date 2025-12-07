const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all locations for a property
router.get('/locations/:propertyId', authenticateToken, async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { type } = req.query;

    let query = 'SELECT * FROM map_locations WHERE property_id = ?';
    const params = [propertyId];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY type, name';

    const [locations] = await pool.execute(query, params);

    res.json(locations);
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get emergency contacts
router.get('/emergency/:propertyId', authenticateToken, async (req, res) => {
  try {
    const { propertyId } = req.params;

    const [contacts] = await pool.execute(
      'SELECT * FROM emergency_contacts WHERE property_id = ? ORDER BY service_type',
      [propertyId]
    );

    res.json(contacts);
  } catch (error) {
    console.error('Get emergency contacts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


