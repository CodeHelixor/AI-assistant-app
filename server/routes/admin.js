const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// All admin routes require admin role
router.use(authenticateToken);
router.use(authorizeRoles('admin', 'host'));

// Get all orders with filters
router.get('/orders', async (req, res) => {
  try {
    const { partner_id, service_type, status, start_date, end_date } = req.query;

    let query = `
      SELECT o.*, 
             u.first_name as guest_first_name, 
             u.last_name as guest_last_name,
             u.email as guest_email,
             p.name as property_name,
             pt.name as partner_name,
             s.name as service_name
      FROM orders o
      LEFT JOIN users u ON o.guest_id = u.id
      LEFT JOIN properties p ON o.property_id = p.id
      LEFT JOIN partners pt ON o.partner_id = pt.id
      LEFT JOIN services s ON o.service_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (partner_id) {
      query += ' AND o.partner_id = ?';
      params.push(partner_id);
    }

    if (service_type) {
      query += ' AND o.service_type = ?';
      params.push(service_type);
    }

    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }

    if (start_date) {
      query += ' AND DATE(o.created_at) >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND DATE(o.created_at) <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY o.created_at DESC';

    const [orders] = await pool.execute(query, params);

    res.json(orders);
  } catch (error) {
    console.error('Get admin orders error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get commission summary
router.get('/commissions', async (req, res) => {
  try {
    const { partner_id, start_date, end_date } = req.query;

    let query = `
      SELECT 
        pt.id as partner_id,
        pt.name as partner_name,
        pt.service_type,
        COUNT(o.id) as total_orders,
        SUM(o.price) as total_revenue,
        SUM(o.commission_amount) as total_commission,
        AVG(o.commission_percentage) as avg_commission_percentage
      FROM partners pt
      LEFT JOIN orders o ON pt.id = o.partner_id
      WHERE o.status = 'completed'
    `;
    const params = [];

    if (partner_id) {
      query += ' AND pt.id = ?';
      params.push(partner_id);
    }

    if (start_date) {
      query += ' AND DATE(o.completed_at) >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND DATE(o.completed_at) <= ?';
      params.push(end_date);
    }

    query += ' GROUP BY pt.id, pt.name, pt.service_type ORDER BY total_commission DESC';

    const [summary] = await pool.execute(query, params);

    // Calculate totals
    const totals = {
      total_orders: summary.reduce((sum, row) => sum + (row.total_orders || 0), 0),
      total_revenue: summary.reduce((sum, row) => sum + parseFloat(row.total_revenue || 0), 0),
      total_commission: summary.reduce((sum, row) => sum + parseFloat(row.total_commission || 0), 0)
    };

    res.json({
      summary,
      totals
    });
  } catch (error) {
    console.error('Get commission summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get orders by partner per month
router.get('/commissions/monthly', async (req, res) => {
  try {
    const { partner_id, year } = req.query;
    const targetYear = year || new Date().getFullYear();

    let query = `
      SELECT 
        pt.id as partner_id,
        pt.name as partner_name,
        MONTH(o.completed_at) as month,
        COUNT(o.id) as order_count,
        SUM(o.price) as revenue,
        SUM(o.commission_amount) as commission
      FROM orders o
      JOIN partners pt ON o.partner_id = pt.id
      WHERE o.status = 'completed' 
        AND YEAR(o.completed_at) = ?
    `;
    const params = [targetYear];

    if (partner_id) {
      query += ' AND pt.id = ?';
      params.push(partner_id);
    }

    query += ' GROUP BY pt.id, pt.name, MONTH(o.completed_at) ORDER BY month, pt.name';

    const [monthly] = await pool.execute(query, params);

    res.json(monthly);
  } catch (error) {
    console.error('Get monthly commissions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Export orders to CSV format (JSON response that can be converted)
router.get('/orders/export', async (req, res) => {
  try {
    const { partner_id, service_type, start_date, end_date } = req.query;

    let query = `
      SELECT 
        o.id,
        o.created_at as order_date,
        u.first_name as guest_first_name,
        u.last_name as guest_last_name,
        u.email as guest_email,
        p.name as property_name,
        pt.name as partner_name,
        s.name as service_name,
        o.service_type,
        o.status,
        o.price,
        o.commission_percentage,
        o.commission_amount
      FROM orders o
      LEFT JOIN users u ON o.guest_id = u.id
      LEFT JOIN properties p ON o.property_id = p.id
      LEFT JOIN partners pt ON o.partner_id = pt.id
      LEFT JOIN services s ON o.service_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (partner_id) {
      query += ' AND o.partner_id = ?';
      params.push(partner_id);
    }

    if (service_type) {
      query += ' AND o.service_type = ?';
      params.push(service_type);
    }

    if (start_date) {
      query += ' AND DATE(o.created_at) >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND DATE(o.created_at) <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY o.created_at DESC';

    const [orders] = await pool.execute(query, params);

    res.json({
      data: orders,
      export_date: new Date().toISOString(),
      total_records: orders.length
    });
  } catch (error) {
    console.error('Export orders error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users (admin only)
router.get('/users', authorizeRoles('admin'), async (req, res) => {
  try {
    const { role } = req.query;

    let query = `
      SELECT 
        id,
        email,
        first_name,
        last_name,
        phone,
        role,
        created_at
      FROM users
      WHERE 1=1
    `;
    const params = [];

    if (role && role !== 'all') {
      query += ' AND role = ?';
      params.push(role);
    }

    query += ' ORDER BY created_at DESC';

    const [users] = await pool.execute(query, params);

    // Get statistics for all roles (always from full database, not filtered)
    const [stats] = await pool.execute(`
      SELECT 
        role,
        COUNT(*) as count
      FROM users
      GROUP BY role
    `);

    // Get total count
    const [totalCount] = await pool.execute('SELECT COUNT(*) as total FROM users');
    const total = totalCount[0]?.total || 0;

    const statistics = {
      total: total,
      admin: 0,
      host: 0,
      guest: 0,
      partner: 0
    };

    stats.forEach(stat => {
      if (stat.role in statistics) {
        statistics[stat.role] = stat.count;
      }
    });

    res.json({
      users,
      statistics
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


