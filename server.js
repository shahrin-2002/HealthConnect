/**
 * Healthcare System REST API
 * Main Server File
 * Port: 9358
 */

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// Import route initializers
const initAuthRoutes = require('./routes/auth');
const hospitalRoutes = require('./routes/hospitals');
const doctorRoutes = require('./routes/doctors');
const userRoutes = require('./routes/userRoutes');
const documentRoutes = require('./routes/documentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const bloodRoutes = require('./routes/bloodRoutes');
const tipRoutes = require('./routes/tipRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  });

// MongoDB connection event handlers
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
  console.error('❌ MongoDB error:', error);
});

// API Routes (MVC Pattern)
app.use('/api/auth', initAuthRoutes());
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/blood-requests', bloodRoutes);
app.use('/api/health-tips', tipRoutes);

// Basic health check endpoint
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'Server is running',
    port: process.env.PORT,
    database: dbStatus
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
const PORT = process.env.PORT || 9358;
app.listen(PORT, () => {
  console.log(`\n🏥 Healthcare API Server running on http://127.0.0.1:${PORT}`);
  console.log(`📝 Endpoints available:`);
  console.log(`   - POST   http://127.0.0.1:${PORT}/api/auth/signup`);
  console.log(`   - POST   http://127.0.0.1:${PORT}/api/auth/login`);
  console.log(`   - GET    http://127.0.0.1:${PORT}/api/hospitals`);
  console.log(`   - GET    http://127.0.0.1:${PORT}/api/hospitals/:id`);
  console.log(`   - POST   http://127.0.0.1:${PORT}/api/hospitals`);
  console.log(`   - GET    http://127.0.0.1:${PORT}/api/doctors`);
  console.log(`   - GET    http://127.0.0.1:${PORT}/api/doctors/:id`);
  console.log(`   - POST   http://127.0.0.1:${PORT}/api/doctors`);
  console.log(`✅ Health check: http://127.0.0.1:${PORT}/health\n`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('\n✅ MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

module.exports = app;
