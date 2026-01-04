/**
 * Healthcare System REST API
 * Main Server File
 * Port: 9358
 */

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Import route initializers
const initAuthRoutes = require('./routes/auth');
const hospitalRoutes = require('./routes/hospitals');
const doctorRoutes = require('./routes/doctors');
const appointmentRoutes = require('./routes/appointmentRoutes');
const icuRoutes = require('./routes/icuRoutes');
const generalBedRoutes = require('./routes/generalBedRoutes');
const cabinRoutes = require('./routes/cabinRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const bloodRoutes = require('./routes/bloodRoutes');
const tipRoutes = require('./routes/tipRoutes');
const labTestRoutes = require('./routes/labTestRoutes');
const testBookingRoutes = require('./routes/testBookingRoutes');

// Import models for Socket.io handlers
const Appointment = require('./models/Appointment');
const Doctor = require('./models/Doctor');

const app = express();

// Create HTTP server and Socket.io instance
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// In-memory storage for video calls
const userSockets = new Map(); // userId -> socketId
const activeCalls = new Map(); // appointmentId -> { doctorId, patientId, status }

// Socket.io JWT authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication required'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`[Socket] User connected: ${socket.userId} (${socket.userRole})`);
  userSockets.set(socket.userId, socket.id);

  // Doctor initiates call to patient
  socket.on('call:initiate', async ({ appointmentId }) => {
    try {
      // Fetch appointment with patient info from database (don't trust client data)
      const appt = await Appointment.findById(appointmentId).populate('doctorId');
      if (!appt || appt.type !== 'online') {
        socket.emit('call:error', { message: 'Invalid appointment' });
        return;
      }

      // Get doctor name
      const doctor = await Doctor.findById(appt.doctorId);
      const doctorName = doctor?.name || 'Doctor';

      // Get patientId from the appointment document (not from client)
      // Handle both populated and non-populated cases
      const patientIdStr = appt.patientId?._id?.toString() || appt.patientId?.toString();

      if (!patientIdStr) {
        socket.emit('call:error', { message: 'Patient not found in appointment' });
        return;
      }

      console.log(`[Socket] call:initiate - Doctor: ${socket.userId}, Patient from DB: ${patientIdStr}`);

      // Store call state
      activeCalls.set(appointmentId, {
        doctorId: socket.userId,
        patientId: patientIdStr,
        status: 'pending'
      });

      // Debug: Log all connected users
      console.log(`[Socket] Looking for patient: ${patientIdStr}`);
      console.log(`[Socket] Connected users:`, Array.from(userSockets.keys()));

      // Send notification to patient
      const patientSocketId = userSockets.get(patientIdStr);
      if (patientSocketId) {
        io.to(patientSocketId).emit('call:incoming', {
          appointmentId,
          doctorId: socket.userId,
          doctorName
        });
        console.log(`[Socket] Call initiated: ${socket.userId} -> ${patientIdStr}`);
      } else {
        socket.emit('call:error', { message: 'Patient is not online' });
        activeCalls.delete(appointmentId);
      }
    } catch (err) {
      console.error('[Socket] call:initiate error:', err);
      socket.emit('call:error', { message: err.message });
    }
  });

  // Patient confirms ready
  socket.on('call:ready', ({ appointmentId, doctorId }) => {
    const call = activeCalls.get(appointmentId);
    if (call) {
      call.status = 'ready';
      const doctorSocketId = userSockets.get(doctorId);
      if (doctorSocketId) {
        io.to(doctorSocketId).emit('call:patient-ready', { appointmentId });
        console.log(`[Socket] Patient ready for call: ${appointmentId}`);
      }
    }
  });

  // Patient declines call
  socket.on('call:decline', ({ appointmentId, doctorId }) => {
    activeCalls.delete(appointmentId);
    const doctorSocketId = userSockets.get(doctorId);
    if (doctorSocketId) {
      io.to(doctorSocketId).emit('call:declined', { appointmentId });
      console.log(`[Socket] Call declined: ${appointmentId}`);
    }
  });

  // WebRTC offer from doctor
  socket.on('webrtc:offer', ({ targetUserId, offer }) => {
    const targetSocketId = userSockets.get(targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc:offer', {
        senderId: socket.userId,
        offer
      });
    }
  });

  // WebRTC answer from patient
  socket.on('webrtc:answer', ({ targetUserId, answer }) => {
    const targetSocketId = userSockets.get(targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc:answer', {
        senderId: socket.userId,
        answer
      });
    }
  });

  // ICE candidate exchange
  socket.on('webrtc:ice-candidate', ({ targetUserId, candidate }) => {
    const targetSocketId = userSockets.get(targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc:ice-candidate', {
        senderId: socket.userId,
        candidate
      });
    }
  });

  // Appointment status update (e.g., completed)
  socket.on('appointment:status-update', ({ appointmentId, patientId, status }) => {
    const patientSocketId = userSockets.get(patientId);
    if (patientSocketId) {
      io.to(patientSocketId).emit('appointment:updated', { appointmentId, status });
      console.log(`[Socket] Appointment ${appointmentId} status updated to ${status}, notified patient`);
    }
  });

  // End call
  socket.on('call:end', ({ appointmentId }) => {
    const call = activeCalls.get(appointmentId);
    if (call) {
      const otherUserId = socket.userId === call.doctorId ? call.patientId : call.doctorId;
      const otherSocketId = userSockets.get(otherUserId);
      if (otherSocketId) {
        io.to(otherSocketId).emit('call:ended', {
          appointmentId,
          endedBy: socket.userId
        });
      }
      activeCalls.delete(appointmentId);
      console.log(`[Socket] Call ended: ${appointmentId}`);
    }
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    console.log(`[Socket] User disconnected: ${socket.userId}`);
    userSockets.delete(socket.userId);

    // Clean up any active calls for this user
    for (const [appointmentId, call] of activeCalls.entries()) {
      if (call.doctorId === socket.userId || call.patientId === socket.userId) {
        const otherUserId = socket.userId === call.doctorId ? call.patientId : call.doctorId;
        const otherSocketId = userSockets.get(otherUserId);
        if (otherSocketId) {
          io.to(otherSocketId).emit('call:ended', {
            appointmentId,
            endedBy: socket.userId,
            reason: 'disconnect'
          });
        }
        activeCalls.delete(appointmentId);
      }
    }
  });
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files for uploaded reports
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  });

// MongoDB connection event handlers
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
  console.error('MongoDB error:', error);
});

// API Routes (MVC Pattern)
app.use('/api/auth', initAuthRoutes());
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/icu', icuRoutes);
app.use('/api/general-bed', generalBedRoutes);
app.use('/api/cabin', cabinRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/blood-requests', bloodRoutes);
app.use('/api/health-tips', tipRoutes);
app.use('/api/lab-tests', labTestRoutes);
app.use('/api/test-bookings', testBookingRoutes);

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
httpServer.listen(PORT, () => {
  console.log(`\nHealthcare API Server running on http://127.0.0.1:${PORT}`);
  console.log(`Endpoints available:`);
  console.log(`   - POST   http://127.0.0.1:${PORT}/api/auth/signup`);
  console.log(`   - POST   http://127.0.0.1:${PORT}/api/auth/login`);
  console.log(`   - POST   http://127.0.0.1:${PORT}/api/auth/verify-otp`);
  console.log(`   - GET    http://127.0.0.1:${PORT}/api/auth/profile`);
  console.log(`   - GET    http://127.0.0.1:${PORT}/api/hospitals`);
  console.log(`   - GET    http://127.0.0.1:${PORT}/api/hospitals/:id`);
  console.log(`   - POST   http://127.0.0.1:${PORT}/api/hospitals`);
  console.log(`   - GET    http://127.0.0.1:${PORT}/api/doctors`);
  console.log(`   - GET    http://127.0.0.1:${PORT}/api/doctors/:id`);
  console.log(`   - GET    http://127.0.0.1:${PORT}/api/doctors/:id/slots`);
  console.log(`   - POST   http://127.0.0.1:${PORT}/api/appointments/book`);
  console.log(`   - PATCH  http://127.0.0.1:${PORT}/api/appointments/:id/reschedule`);
  console.log(`   - DELETE http://127.0.0.1:${PORT}/api/appointments/:id/cancel`);
  console.log(`   - GET    http://127.0.0.1:${PORT}/api/appointments/mine`);
  console.log(`   - GET    http://127.0.0.1:${PORT}/api/appointments/doctor/:doctorId`);
  console.log(`Health check: http://127.0.0.1:${PORT}/health\n`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

module.exports = app;
