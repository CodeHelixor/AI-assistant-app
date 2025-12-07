const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Create order
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { property_id, service_id, partner_id, service_type, price, order_details } = req.body;
    const guest_id = req.user.id;

    if (!property_id || !service_type) {
      return res.status(400).json({ error: 'Property ID and service type are required' });
    }

    // Get partner commission info if partner_id provided
    let commission_percentage = 0;
    let commission_amount = 0;

    if (partner_id) {
      const [partners] = await pool.execute(
        'SELECT commission_percentage, commission_fixed FROM partners WHERE id = ?',
        [partner_id]
      );

      if (partners.length > 0) {
        const partner = partners[0];
        commission_percentage = parseFloat(partner.commission_percentage) || 0;
        const commissionFixed = parseFloat(partner.commission_fixed) || 0;

        if (price) {
          if (commission_percentage > 0) {
            commission_amount = (parseFloat(price) * commission_percentage) / 100;
          } else if (commissionFixed > 0) {
            commission_amount = commissionFixed;
          }
        }
      }
    }

    const [result] = await pool.execute(
      `INSERT INTO orders 
       (guest_id, property_id, service_id, partner_id, service_type, price, 
        commission_percentage, commission_amount, order_details, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        guest_id,
        property_id,
        service_id || null,
        partner_id || null,
        service_type,
        price || null,
        commission_percentage,
        commission_amount,
        order_details ? JSON.stringify(order_details) : null
      ]
    );

    const [newOrder] = await pool.execute(
      `SELECT o.*, u.first_name, u.last_name, u.email as guest_email,
       p.name as property_name, pt.name as partner_name, s.name as service_name
       FROM orders o
       LEFT JOIN users u ON o.guest_id = u.id
       LEFT JOIN properties p ON o.property_id = p.id
       LEFT JOIN partners pt ON o.partner_id = pt.id
       LEFT JOIN services s ON o.service_id = s.id
       WHERE o.id = ?`,
      [result.insertId]
    );

    res.status(201).json(newOrder[0]);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Server error creating order' });
  }
});

// Get orders for current user
router.get('/my-orders', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [orders] = await pool.execute(
      `SELECT o.*, p.name as property_name, pt.name as partner_name, s.name as service_name
       FROM orders o
       LEFT JOIN properties p ON o.property_id = p.id
       LEFT JOIN partners pt ON o.partner_id = pt.id
       LEFT JOIN services s ON o.service_id = s.id
       WHERE o.guest_id = ?
       ORDER BY o.created_at DESC`,
      [userId]
    );

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update order status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData = { status };
    if (status === 'completed') {
      updateData.completed_at = new Date();
    }

    await pool.execute(
      'UPDATE orders SET status = ?, completed_at = ? WHERE id = ?',
      [status, updateData.completed_at || null, id]
    );

    res.json({ message: 'Order status updated', status });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


