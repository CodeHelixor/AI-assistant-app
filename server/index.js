const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const authRoutes = require('./routes/auth');
const propertyRoutes = require('./routes/properties');
const aiAssistantRoutes = require('./routes/aiAssistant');
const serviceRoutes = require('./routes/services');
const orderRoutes = require('./routes/orders');
const chatRoutes = require('./routes/chat');
const weatherRoutes = require('./routes/weather');
const adminRoutes = require('./routes/admin');
const mapRoutes = require('./routes/map');
const issuesRoutes = require('./routes/issues');
const feedbackRoutes = require('./routes/feedback');
const tripPlannerRoutes = require('./routes/tripPlanner');
const notificationsRoutes = require('./routes/notifications');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/ai-assistant', aiAssistantRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/issues', issuesRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/trip-planner', tripPlannerRoutes);
app.use('/api/notifications', notificationsRoutes);

// Socket.io for real-time chat
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
  });

  socket.on('send-message', (data) => {
    io.to(data.roomId).emit('receive-message', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Database connection check endpoint
app.get('/api/health/db', async (req, res) => {
  const { testDatabaseConnection } = require('./config/database');
  const dbStatus = await testDatabaseConnection();
  if (dbStatus.connected) {
    res.json({ 
      status: 'OK', 
      message: 'Database connected',
      database: dbStatus.database,
      tableCount: dbStatus.tableCount,
      serverTime: dbStatus.serverTime
    });
  } else {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Database connection failed',
      error: dbStatus.error
    });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io };

