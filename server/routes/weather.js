const express = require('express');
const axios = require('axios');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get weather data
router.get('/:propertyId', authenticateToken, async (req, res) => {
  try {
    const { propertyId } = req.params;

    // Get property coordinates
    const [properties] = await pool.execute(
      'SELECT latitude, longitude FROM properties WHERE id = ?',
      [propertyId]
    );

    if (properties.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const { latitude, longitude } = properties[0];

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Property coordinates not set' });
    }

    // Get weather from OpenWeatherMap
    const weatherResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${process.env.WEATHER_API_KEY}&units=metric`
    );

    const weather = weatherResponse.data;

    // Get UV index (requires UV index API call)
    let uvIndex = null;
    try {
      const uvResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/uvi?lat=${latitude}&lon=${longitude}&appid=${process.env.WEATHER_API_KEY}`
      );
      uvIndex = uvResponse.data.value;
    } catch (uvError) {
      console.log('UV index not available');
    }

    // Tide data would require a separate API (e.g., Tides API)
    // For now, we'll return null and it can be integrated later
    const tideData = null;

    res.json({
      temperature: weather.main.temp,
      feels_like: weather.main.feels_like,
      humidity: weather.main.humidity,
      pressure: weather.main.pressure,
      description: weather.weather[0].description,
      icon: weather.weather[0].icon,
      wind_speed: weather.wind?.speed || 0,
      wind_direction: weather.wind?.deg || 0,
      uv_index: uvIndex,
      tide_data: tideData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Weather API error:', error);
    res.status(500).json({ error: 'Error fetching weather data' });
  }
});

module.exports = router;


