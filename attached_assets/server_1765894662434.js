/**
 * GeoLingua Backend Server
 * P2P Translator Platform - Bolt/Uber style
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// Import routes
const authRoutes = require('./routes/auth');
const translatorRoutes = require('./routes/translators');
const requestRoutes = require('./routes/requests');
const callRoutes = require('./routes/calls');
const paymentRoutes = require('./routes/payments');

// Import socket handlers
const socketHandler = require('./sockets/handler');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Make io accessible in routes
app.set('io', io);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'GeoLingua API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/translators', translatorRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/payments', paymentRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);
  socketHandler(io, socket);
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`
  🌍 GeoLingua Server Running!
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🚀 Port: ${PORT}
  📡 Environment: ${process.env.NODE_ENV || 'development'}
  ⏰ Started: ${new Date().toLocaleString()}
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

module.exports = { app, io };
