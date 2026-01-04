/**
 * Socket.io Client Service
 * Handles real-time communication for video calls
 */

import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:9358';

class SocketService {
  socket = null;

  connect(token) {
    if (this.socket?.connected) {
      console.log('[Socket] Already connected:', this.socket.id);
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket.id);
    });

    this.socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    this.socket.on('call:error', ({ message }) => {
      console.error('[Socket] Call error:', message);
    });

    // Debug: Log all incoming events
    this.socket.onAny((event, ...args) => {
      console.log('[Socket] Event received:', event, args);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }

  // ========== Call Events ==========

  // Doctor initiates call to patient (server gets patientId from appointment)
  initiateCall(appointmentId) {
    this.socket?.emit('call:initiate', { appointmentId });
  }

  // Patient confirms ready for call
  confirmReady(appointmentId, doctorId) {
    this.socket?.emit('call:ready', { appointmentId, doctorId });
  }

  // Patient declines call
  declineCall(appointmentId, doctorId) {
    this.socket?.emit('call:decline', { appointmentId, doctorId });
  }

  // End call (either party)
  endCall(appointmentId) {
    this.socket?.emit('call:end', { appointmentId });
  }

  // Notify patient of appointment status update
  notifyAppointmentUpdate(appointmentId, patientId, status) {
    this.socket?.emit('appointment:status-update', { appointmentId, patientId, status });
  }

  // ========== WebRTC Signaling ==========

  sendOffer(targetUserId, offer) {
    this.socket?.emit('webrtc:offer', { targetUserId, offer });
  }

  sendAnswer(targetUserId, answer) {
    this.socket?.emit('webrtc:answer', { targetUserId, answer });
  }

  sendIceCandidate(targetUserId, candidate) {
    this.socket?.emit('webrtc:ice-candidate', { targetUserId, candidate });
  }

  // ========== Event Listeners ==========

  // Patient receives incoming call
  onIncomingCall(callback) {
    this.socket?.on('call:incoming', callback);
  }

  // Doctor notified patient is ready
  onPatientReady(callback) {
    this.socket?.on('call:patient-ready', callback);
  }

  // Doctor notified patient declined
  onCallDeclined(callback) {
    this.socket?.on('call:declined', callback);
  }

  // Receive WebRTC offer
  onWebRTCOffer(callback) {
    this.socket?.on('webrtc:offer', callback);
  }

  // Receive WebRTC answer
  onWebRTCAnswer(callback) {
    this.socket?.on('webrtc:answer', callback);
  }

  // Receive ICE candidate
  onIceCandidate(callback) {
    this.socket?.on('webrtc:ice-candidate', callback);
  }

  // Call ended by other party
  onCallEnded(callback) {
    this.socket?.on('call:ended', callback);
  }

  // Call error
  onCallError(callback) {
    this.socket?.on('call:error', callback);
  }

  // Appointment status updated
  onAppointmentUpdated(callback) {
    this.socket?.on('appointment:updated', callback);
  }

  // Remove all listeners
  removeAllListeners() {
    this.socket?.removeAllListeners();
  }

  // Remove specific listener
  off(event) {
    this.socket?.off(event);
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;
