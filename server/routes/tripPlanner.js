const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Save location
router.post('/save-location', authenticateToken, async (req, res) => {
  try {
    const { location_id, custom_name, notes } = req.body;
    const guest_id = req.user.id;

    if (!location_id) {
      return res.status(400).json({ error: 'Location ID is required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO saved_locations (guest_id, location_id, custom_name, notes) VALUES (?, ?, ?, ?)',
      [guest_id, location_id, custom_name || null, notes || null]
    );

    const [saved] = await pool.execute(
      `SELECT sl.*, ml.name, ml.type, ml.latitude, ml.longitude, ml.description
       FROM saved_locations sl
       JOIN map_locations ml ON sl.location_id = ml.id
       WHERE sl.id = ?`,
      [result.insertId]
    );

    res.status(201).json(saved[0]);
  } catch (error) {
    console.error('Save location error:', error);
    res.status(500).json({ error: 'Server error saving location' });
  }
});

// Get saved locations
router.get('/saved-locations', authenticateToken, async (req, res) => {
  try {
    const guest_id = req.user.id;

    const [locations] = await pool.execute(
      `SELECT sl.*, ml.name, ml.type, ml.latitude, ml.longitude, ml.description, ml.address
       FROM saved_locations sl
       JOIN map_locations ml ON sl.location_id = ml.id
       WHERE sl.guest_id = ?
       ORDER BY sl.created_at DESC`,
      [guest_id]
    );

    res.json(locations);
  } catch (error) {
    console.error('Get saved locations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete saved location
router.delete('/saved-locations/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const guest_id = req.user.id;

    await pool.execute(
      'DELETE FROM saved_locations WHERE id = ? AND guest_id = ?',
      [id, guest_id]
    );

    res.json({ message: 'Location removed from saved' });
  } catch (error) {
    console.error('Delete saved location error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create itinerary
router.post('/itinerary', authenticateToken, async (req, res) => {
  try {
    const { booking_id, title, date, activities } = req.body;
    const guest_id = req.user.id;

    if (!title || !date) {
      return res.status(400).json({ error: 'Title and date are required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO itineraries (guest_id, booking_id, title, date, activities) VALUES (?, ?, ?, ?, ?)',
      [guest_id, booking_id || null, title, date, activities ? JSON.stringify(activities) : null]
    );

    const [newItinerary] = await pool.execute(
      'SELECT * FROM itineraries WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newItinerary[0]);
  } catch (error) {
    console.error('Create itinerary error:', error);
    res.status(500).json({ error: 'Server error creating itinerary' });
  }
});

// Get itineraries
router.get('/itineraries', authenticateToken, async (req, res) => {
  try {
    const guest_id = req.user.id;
    const { booking_id } = req.query;

    let query = 'SELECT * FROM itineraries WHERE guest_id = ?';
    const params = [guest_id];

    if (booking_id) {
      query += ' AND booking_id = ?';
      params.push(booking_id);
    }

    query += ' ORDER BY date DESC, created_at DESC';

    const [itineraries] = await pool.execute(query, params);

    res.json(itineraries);
  } catch (error) {
    console.error('Get itineraries error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update itinerary
router.put('/itinerary/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, activities } = req.body;
    const guest_id = req.user.id;

    await pool.execute(
      'UPDATE itineraries SET title = ?, date = ?, activities = ? WHERE id = ? AND guest_id = ?',
      [title, date, activities ? JSON.stringify(activities) : null, id, guest_id]
    );

    const [updated] = await pool.execute(
      'SELECT * FROM itineraries WHERE id = ?',
      [id]
    );

    res.json(updated[0]);
  } catch (error) {
    console.error('Update itinerary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete itinerary
router.delete('/itinerary/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const guest_id = req.user.id;

    await pool.execute(
      'DELETE FROM itineraries WHERE id = ? AND guest_id = ?',
      [id, guest_id]
    );

    res.json({ message: 'Itinerary deleted' });
  } catch (error) {
    console.error('Delete itinerary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;


