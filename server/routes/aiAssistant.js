const express = require('express');
const OpenAI = require('openai');
const { pool } = require('../config/database');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Initialize OpenAI client only if API key is available
let openai = null;
const apiKey = process.env.OPENAI_API_KEY;

if (apiKey) {
  try {
    // Check if API key looks valid (starts with sk- or sk-proj-)
    const trimmedKey = apiKey.trim();
    if (!trimmedKey.startsWith('sk-')) {
      console.warn('⚠️  OPENAI_API_KEY format may be invalid (should start with "sk-" or "sk-proj-")');
    }
    openai = new OpenAI({
      apiKey: trimmedKey
    });
    console.log('✅ OpenAI client initialized successfully');
    // Show first 10 and last 4 characters for security
    const displayKey = trimmedKey.length > 14 
      ? `${trimmedKey.substring(0, 10)}...${trimmedKey.substring(trimmedKey.length - 4)}`
      : `${trimmedKey.substring(0, 7)}...`;
    console.log(`   API Key: ${displayKey}`);
  } catch (error) {
    console.error('❌ Failed to initialize OpenAI client:', error.message);
  }
} else {
  console.warn('⚠️  OPENAI_API_KEY not found. AI Assistant features will be disabled.');
  console.warn('   Please set OPENAI_API_KEY in your server/.env file');
  console.warn('   Make sure dotenv is loading the .env file correctly');
}

// AI Assistant Chat - Allow guest access (optional auth)
router.post('/chat', optionalAuth, async (req, res) => {
  try {
    if (!openai) {
      console.error('OpenAI client not initialized. Check OPENAI_API_KEY in environment.');
      return res.status(503).json({ 
        error: 'AI Assistant is not available. OPENAI_API_KEY is not configured.' 
      });
    }

    const { message, property_id } = req.body;
    // Optional: get userId from token if available, otherwise use null for guest
    const userId = req.user?.id || null;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get property information
    let propertyContext = '';
    if (property_id) {
      const [properties] = await pool.execute(
        'SELECT * FROM properties WHERE id = ?',
        [property_id]
      );

      if (properties.length > 0) {
        const property = properties[0];

        // Get equipment instructions
        const [equipment] = await pool.execute(
          'SELECT equipment_name, instructions FROM equipment_instructions WHERE property_id = ?',
          [property_id]
        );

        // Get house rules
        const [rules] = await pool.execute(
          'SELECT rule_text FROM house_rules WHERE property_id = ?',
          [property_id]
        );

        // Get map locations
        const [locations] = await pool.execute(
          'SELECT name, type, description FROM map_locations WHERE property_id = ?',
          [property_id]
        );

        propertyContext = `
Property Information:
- Name: ${property.name}
- Address: ${property.address || 'N/A'}
- Description: ${property.description || 'N/A'}

Equipment Instructions:
${equipment.map(e => `- ${e.equipment_name}: ${e.instructions}`).join('\n')}

House Rules:
${rules.map(r => `- ${r.rule_text}`).join('\n')}

Nearby Locations:
${locations.map(l => `- ${l.name} (${l.type}): ${l.description || ''}`).join('\n')}
        `;
      }
    }

    const systemPrompt = `You are a helpful AI assistant for a rental property guest experience app. 
Your role is to help guests with:
1. Property-specific questions and information
2. Equipment instructions and troubleshooting
3. Local recommendations (restaurants, beaches, viewpoints, historical sites, activities)
4. General travel guidance

${propertyContext ? `\nCurrent Property Context:\n${propertyContext}` : ''}

Be friendly, concise, and helpful. If you don't know something specific about the property, say so but try to provide general helpful information.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const response = completion.choices[0].message.content;

    res.json({
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI Assistant error:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      response: error.response?.data,
      type: error.constructor.name
    });
    
    // Provide more detailed error information
    let errorMessage = 'Error communicating with AI assistant';
    if (error.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Generate trip itinerary - Allow guest access (optional auth)
router.post('/generate-itinerary', optionalAuth, async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({ 
        error: 'AI Assistant is not available. OPENAI_API_KEY is not configured.' 
      });
    }

    const { property_id, date, preferences } = req.body;

    if (!property_id || !date) {
      return res.status(400).json({ error: 'Property ID and date are required' });
    }

    // Get local locations
    const [locations] = await pool.execute(
      'SELECT name, type, description FROM map_locations WHERE property_id = ?',
      [property_id]
    );

    const locationsContext = locations.map(l => 
      `- ${l.name} (${l.type}): ${l.description || ''}`
    ).join('\n');

    const prompt = `Generate a day trip itinerary for ${date}. 
Available locations:
${locationsContext}

${preferences ? `Guest preferences: ${preferences}` : ''}

Provide a structured itinerary with times, activities, and recommendations.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a travel planning assistant. Create detailed, practical day trip itineraries." },
        { role: "user", content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 800
    });

    const itinerary = completion.choices[0].message.content;

    res.json({
      itinerary,
      date,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Itinerary generation error:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      response: error.response?.data,
      type: error.constructor.name
    });
    
    // Provide more detailed error information
    let errorMessage = 'Error generating itinerary';
    if (error.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;


