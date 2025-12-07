const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Create property (host/admin only)
// IMPORTANT: This route must come BEFORE the GET /:id route to avoid route conflicts
router.post('/', authenticateToken, authorizeRoles('admin', 'host'), async (req, res) => {
  try {
    console.log('POST /properties - Creating property');
    console.log('Request body:', req.body);
    console.log('User:', req.user);
    
    const { name, address, description, check_in_time, check_out_time, max_guests, latitude, longitude, id } = req.body;
    const hostId = req.user.id;

    if (!name) {
      return res.status(400).json({ error: 'Property name is required' });
    }

    // If id is provided, try to insert with that id, otherwise let it auto-increment
    let result;
    if (id) {
      // Check if property with this id already exists
      const [existing] = await pool.execute('SELECT id FROM properties WHERE id = ?', [id]);
      if (existing.length > 0) {
        return res.status(400).json({ error: 'Property with this ID already exists' });
      }
      // Insert with specific id
      [result] = await pool.execute(
        `INSERT INTO properties (id, name, address, description, host_id, check_in_time, check_out_time, max_guests, latitude, longitude)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, name, address || null, description || null, hostId, check_in_time || null, check_out_time || null, max_guests || null, latitude || null, longitude || null]
      );
    } else {
      // Auto-increment id
      [result] = await pool.execute(
        `INSERT INTO properties (name, address, description, host_id, check_in_time, check_out_time, max_guests, latitude, longitude)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, address || null, description || null, hostId, check_in_time || null, check_out_time || null, max_guests || null, latitude || null, longitude || null]
      );
    }

    console.log('Property created successfully with ID:', id || result.insertId);
    res.status(201).json({ 
      id: id || result.insertId, 
      message: 'Property created successfully' 
    });
  } catch (error) {
    console.error('Create property error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

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

// Update property (host/admin only)
router.put('/:id', authenticateToken, authorizeRoles('admin', 'host'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, description, check_in_time, check_out_time, max_guests, latitude, longitude } = req.body;

    await pool.execute(
      `UPDATE properties 
       SET name = ?, address = ?, description = ?, check_in_time = ?, check_out_time = ?, 
           max_guests = ?, latitude = ?, longitude = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, address, description, check_in_time || null, check_out_time || null, max_guests || null, latitude || null, longitude || null, id]
    );

    res.json({ message: 'Property updated successfully' });
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add equipment instruction (host/admin only)
router.post('/:id/equipment', authenticateToken, authorizeRoles('admin', 'host'), async (req, res) => {
  try {
    const { id } = req.params;
    const { equipment_name, instructions, troubleshooting, image_url } = req.body;

    if (!equipment_name || !instructions) {
      return res.status(400).json({ error: 'Equipment name and instructions are required' });
    }

    const [result] = await pool.execute(
      `INSERT INTO equipment_instructions (property_id, equipment_name, instructions, troubleshooting, image_url)
       VALUES (?, ?, ?, ?, ?)`,
      [id, equipment_name, instructions, troubleshooting || null, image_url || null]
    );

    res.json({ id: result.insertId, message: 'Equipment added successfully' });
  } catch (error) {
    console.error('Add equipment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update equipment instruction (host/admin only)
router.put('/:id/equipment/:equipmentId', authenticateToken, authorizeRoles('admin', 'host'), async (req, res) => {
  try {
    const { equipmentId } = req.params;
    const { equipment_name, instructions, troubleshooting, image_url } = req.body;

    await pool.execute(
      `UPDATE equipment_instructions 
       SET equipment_name = ?, instructions = ?, troubleshooting = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [equipment_name, instructions, troubleshooting || null, image_url || null, equipmentId]
    );

    res.json({ message: 'Equipment updated successfully' });
  } catch (error) {
    console.error('Update equipment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete equipment instruction (host/admin only)
router.delete('/:id/equipment/:equipmentId', authenticateToken, authorizeRoles('admin', 'host'), async (req, res) => {
  try {
    const { equipmentId } = req.params;

    await pool.execute('DELETE FROM equipment_instructions WHERE id = ?', [equipmentId]);

    res.json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    console.error('Delete equipment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add house rule (host/admin only)
router.post('/:id/rules', authenticateToken, authorizeRoles('admin', 'host'), async (req, res) => {
  try {
    const { id } = req.params;
    const { rule_text, category } = req.body;

    if (!rule_text) {
      return res.status(400).json({ error: 'Rule text is required' });
    }

    const [result] = await pool.execute(
      `INSERT INTO house_rules (property_id, rule_text, category)
       VALUES (?, ?, ?)`,
      [id, rule_text, category || null]
    );

    res.json({ id: result.insertId, message: 'Rule added successfully' });
  } catch (error) {
    console.error('Add rule error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update house rule (host/admin only)
router.put('/:id/rules/:ruleId', authenticateToken, authorizeRoles('admin', 'host'), async (req, res) => {
  try {
    const { ruleId } = req.params;
    const { rule_text, category } = req.body;

    await pool.execute(
      `UPDATE house_rules 
       SET rule_text = ?, category = ?
       WHERE id = ?`,
      [rule_text, category || null, ruleId]
    );

    res.json({ message: 'Rule updated successfully' });
  } catch (error) {
    console.error('Update rule error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete house rule (host/admin only)
router.delete('/:id/rules/:ruleId', authenticateToken, authorizeRoles('admin', 'host'), async (req, res) => {
  try {
    const { ruleId } = req.params;

    await pool.execute('DELETE FROM house_rules WHERE id = ?', [ruleId]);

    res.json({ message: 'Rule deleted successfully' });
  } catch (error) {
    console.error('Delete rule error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update stargazing info (host/admin only)
router.put('/:id/stargazing', authenticateToken, authorizeRoles('admin', 'host'), async (req, res) => {
  try {
    const { id } = req.params;
    const { tips, best_viewing_times, recommended_locations } = req.body;

    // Check if stargazing info exists
    const [existing] = await pool.execute(
      'SELECT * FROM stargazing_info WHERE property_id = ?',
      [id]
    );

    if (existing.length > 0) {
      // Update existing
      await pool.execute(
        `UPDATE stargazing_info 
         SET tips = ?, best_viewing_times = ?, recommended_locations = ?, updated_at = CURRENT_TIMESTAMP
         WHERE property_id = ?`,
        [tips || null, best_viewing_times || null, recommended_locations || null, id]
      );
    } else {
      // Create new
      await pool.execute(
        `INSERT INTO stargazing_info (property_id, tips, best_viewing_times, recommended_locations)
         VALUES (?, ?, ?, ?)`,
        [id, tips || null, best_viewing_times || null, recommended_locations || null]
      );
    }

    res.json({ message: 'Stargazing information updated successfully' });
  } catch (error) {
    console.error('Update stargazing error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


