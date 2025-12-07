const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all services
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { type, partner_id } = req.query;

    let query = 'SELECT s.*, p.name as partner_name, p.phone as partner_phone FROM services s LEFT JOIN partners p ON s.partner_id = p.id WHERE s.is_available = TRUE';
    const params = [];

    if (type) {
      query += ' AND s.type = ?';
      params.push(type);
    }

    if (partner_id) {
      query += ' AND s.partner_id = ?';
      params.push(partner_id);
    }

    query += ' ORDER BY s.name';

    const [services] = await pool.execute(query, params);

    res.json(services);
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all partners
router.get('/partners', authenticateToken, async (req, res) => {
  try {
    const { service_type } = req.query;

    let query = 'SELECT * FROM partners WHERE is_active = TRUE';
    const params = [];

    if (service_type) {
      query += ' AND service_type = ?';
      params.push(service_type);
    }

    query += ' ORDER BY name';

    const [partners] = await pool.execute(query, params);

    res.json(partners);
  } catch (error) {
    console.error('Get partners error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get service by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [services] = await pool.execute(
      `SELECT s.*, p.name as partner_name, p.phone as partner_phone, 
       p.email as partner_email, p.description as partner_description 
       FROM services s 
       LEFT JOIN partners p ON s.partner_id = p.id 
       WHERE s.id = ?`,
      [id]
    );

    if (services.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json(services[0]);
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


